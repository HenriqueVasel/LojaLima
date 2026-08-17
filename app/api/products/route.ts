import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";
import { calcularPrecoVenda } from "@/app/lib/pricing";
import { getFinalPrice } from "@/app/lib/price";
import { expandTerms, normalize, tokenize } from "@/app/lib/search";


export async function GET(req: Request) {

try {

const { searchParams } = new URL(req.url);
const page = Number(searchParams.get("page") || 1);
const limit = Number(searchParams.get("limit") || 20);
const sort = searchParams.get("sort");
const search = searchParams.get("q") || searchParams.get("search");
const category = searchParams.get("category");
const brand = searchParams.get("brand");
console.log("URL:", req.url);
console.log("SEARCH PARAM Q:", searchParams.get("q"));

const min = searchParams.get("min");
const max = searchParams.get("max");

/* =========================
ORDER BY DINÂMICO
========================= */

let orderBy: any = [
  {
    priceCents: "desc",
  },
  {
    createdAt: "desc",
  },
];

if (sort === "price_asc") {
  orderBy = { priceCents: "asc" };
}

if (sort === "price_desc") {
  orderBy = { priceCents: "desc" };
}

if (sort === "recent") {
  orderBy = { createdAt: "desc" };
}

/* =========================
FILTROS
========================= */

const where: any = {
  active: true,

  // 🔥 evita produto sem estoque
 stock: {
  quantity: {
    gt: 0,
  },
},

  // 🔥 evita produtos baratos/genéricos
 
};

where.productimage = {
  some: {
    url: {
      not: "",
    },
  },
};

/* busca */

/* busca */

if (search) {

  const normalizedSearch = normalize(search);

  const tokens = tokenize(normalizedSearch);

  where.AND = tokens.map((token) => ({

    OR: [

      {
        name: {
          contains: token,
          mode: "insensitive",
        },
      },

      {
        slug: {
          contains: token,
          mode: "insensitive",
        },
      },

      {
        brand: {
          contains: token,
          mode: "insensitive",
        },
      },

      {
        sku: {
          contains: token,
          mode: "insensitive",
        },
      },

    ],

  }));

}
/* categoria */

if (category) {

  // Busca a categoria selecionada
  const selectedCategory = await prisma.category.findUnique({
    where: {
      slug: category,
    },
    select: {
      id: true,
    },
  });

  if (selectedCategory) {

    // Busca todas as categorias ativas
    const allCategories = await prisma.category.findMany({
      where: {
        active: true,
      },
      select: {
        id: true,
        parentId: true,
      },
    });

    // Começa pela categoria selecionada
    const categoryIds = [selectedCategory.id];

    // Encontra todas as categorias filhas,
    // netas, bisnetas etc.
    let changed = true;

    while (changed) {

      changed = false;

      for (const cat of allCategories) {

        if (
          cat.parentId !== null &&
          categoryIds.includes(cat.parentId) &&
          !categoryIds.includes(cat.id)
        ) {
          categoryIds.push(cat.id);
          changed = true;
        }

      }

    }

    // Busca produtos pertencentes à categoria
    // ou a qualquer uma de suas subcategorias
    where.productcategory = {
      some: {
        categoryId: {
          in: categoryIds,
        },
      },
    };

  }

}


/* =========================
MARCA
========================= */

if (brand) {

  const selectedBrand =
    await prisma.brand.findUnique({
      where: {
        slug: brand,
      },

      select: {
        id: true,
      },
    });

  if (selectedBrand) {

    where.brandRefId =
      selectedBrand.id;

  } else {

    // Marca não existe:
    // força nenhum produto a aparecer

    where.brandRefId = -1;

  }
}

/* preço */

if (min || max) {
  where.priceCents = {};

  if (min) {
    where.priceCents.gte = Number(min) * 100;
  }

  if (max) {
    where.priceCents.lte = Number(max) * 100;
  }
}

/* =========================
QUERY
========================= */



let products = await prisma.product.findMany({
  where,

  include: {
    promotion: true,

    productimage: {
      orderBy: {
        sortOrder: "asc",
      },
      take: 1,
    },
  },

  orderBy,

  skip: (page - 1) * limit,
  take: limit,
});

if (
  category === "cftv" &&
  page === 1 &&
  !search &&
  !min &&
  !max &&
  !sort
) {

  const destaqueIds = [

    // VIP / IP
    6135,
    6264,
    6140,
    7577,
    7005,
    5764,
    7806,
    8369,
    8405,

    // WIFI
    5660,
    6070,
    7457,
    6257,
    6761,

    // VHD de entrada
    7358,
    8427,
    5712,
    6691,
    5693,
    7459,
    7447,
    7705,
    5819,
  ];

  const destaque = await prisma.product.findMany({
    

    
    where: {
      id: {
        in: destaqueIds,
      },
      active: true,
    },

    include: {
      promotion: true,

      productimage: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
      },
    },
  });

  destaque.sort(
  (a, b) =>
    destaqueIds.indexOf(a.id) -
    destaqueIds.indexOf(b.id)
);

  const restantes = products.filter(
    (p) => !destaqueIds.includes(p.id)
  );

  products = [
    ...destaque,
    ...restantes,
  ];
}

console.log(
  products.map((p) => ({
    id: p.id,
    nome: p.name,
  }))
);

const productsWithPrice = products.map((p) => {

  const originalPrice =
    calcularPrecoVenda(p.priceCents);

  const promotionalPrice =
    getFinalPrice({
      ...p,
      priceCents: originalPrice,
    });

  return {
    ...p,

    priceCentsOriginal: originalPrice,

    priceCents:
      promotionalPrice,

    hasPromotion:
      promotionalPrice <
      originalPrice,
  };
});

return NextResponse.json(productsWithPrice);


} catch (error) {


console.error("Erro ao buscar produtos", error);

return NextResponse.json(
  { error: "Erro ao buscar produtos" },
  { status: 500 }
);


}

}
