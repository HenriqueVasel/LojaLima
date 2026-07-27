import s from "@/app/styles/SpecsFaq.module.css";

import ProductSpecs from "./ProductSpecs";
import ProductFAQ from "./ProductFAQ";

interface Props{
    product:any;
}

export default function SpecsFaq({product}:Props){

    return(

        <section className={s.grid}>

            <ProductSpecs
                brand={product.brand}
                sku={product.sku}
            />

            <ProductFAQ/>

        </section>

    )

}