export default function CategoriesTable({ categories }) {

  return (
    <table className="w-full border-collapse">

      <thead>
        <tr>
          <th>Categoría</th>
          <th>Productos</th>
        </tr>
      </thead>


      <tbody>

        {categories.map((category) => (
          <tr key={category.id}>
            <td>
              {category.name}
            </td>

            <td>
              {category.items.length}
            </td>
          </tr>
        ))}

      </tbody>

    </table>
  );
}