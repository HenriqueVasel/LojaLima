import s from "@/app/styles/ProductSpecs.module.css";

interface Props {
  brand?: string;
  model?: string;
  sku?: string;
  category?: string;
  warranty?: string;
}

export default function ProductSpecs({
  brand,
  model,
  sku,
  category,
  warranty,
}: Props) {
  return (
    <div className={s.card}>
      <h3>Especificações Técnicas</h3>

      <table>

        <tbody>

          <tr>
            <td>Marca</td>
            <td>{brand || "Intelbras"}</td>
          </tr>

          <tr>
            <td>Modelo</td>
            <td>{model || "—"}</td>
          </tr>

          <tr>
            <td>Categoria</td>
            <td>{category || "Segurança Eletrônica"}</td>
          </tr>

          <tr>
            <td>SKU</td>
            <td>{sku || "—"}</td>
          </tr>

          <tr>
            <td>Garantia</td>
            <td>{warranty || "1 ano"}</td>
          </tr>

        </tbody>

      </table>
    </div>
  );
}   