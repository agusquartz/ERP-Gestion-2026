export default function ItemsTable({ items }) {

  return (
    <table className="w-full border-collapse">

      <thead>
        <tr>
          <th>Producto</th>
          <th>Categoría</th>
          <th>Cantidad</th>
        </tr>
      </thead>


      <tbody>

        {items.map((item) => (
          <tr key={item.id}>
            <td>
              {item.product.description}
            </td>

            <td>
              {item.product.category.name}
            </td>

            <td>
              {item.quantity}
            </td>
          </tr>
        ))}

      </tbody>

    </table>
  );
}