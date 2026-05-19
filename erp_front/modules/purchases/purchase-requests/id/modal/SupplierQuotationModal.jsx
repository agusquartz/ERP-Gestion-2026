"use client";

import { useEffect, useMemo, useState } from "react";

export default function SupplierQuotationModal({
  supplier,
  open,
  readonly,
  onClose,
  onSave,
}) {

  const [rows, setRows] = useState([]);


  useEffect(() => {
    if (!supplier) return;

    setRows(supplier.details ?? []);

  }, [supplier]);


  const discardAll = useMemo(() => {
    if (rows.length === 0) {
      return false;
    }

    return rows.every((row) => row.excluded);

  }, [rows]);


  function toggleDiscardAll(value) {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        excluded: value,
      }))
    );
  }


  function toggleRow(index) {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              excluded: !row.excluded,
            }
          : row
      )
    );
  }

}