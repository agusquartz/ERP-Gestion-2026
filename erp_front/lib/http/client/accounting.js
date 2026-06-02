import { clientRequest } from "./request";

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

// =========================================================
// ACCOUNTING PROCESSES
// =========================================================

export function getAccountingProcesses() {
  return clientRequest("/accounting/processes", {
    method: "GET",
  });
}

export function getAccountingProcessById(id) {
  if (!id) throw new Error("Accounting process ID is required");

  return clientRequest(`/accounting/processes/${id}`, {
    method: "GET",
  });
}

// =========================================================
// CHART OF ACCOUNTS
// =========================================================

export function getChartOfAccounts({ accountingProcessId, tree } = {}) {
  const query = buildQuery({
    accountingProcessId,
    tree,
  });

  return clientRequest(`/accounting/chart-of-accounts${query}`, {
    method: "GET",
  });
}

export function getChartAccountById(id) {
  if (!id) throw new Error("Chart account ID is required");

  return clientRequest(`/accounting/chart-of-accounts/${id}`, {
    method: "GET",
  });
}

// =========================================================
// JOURNAL ENTRIES
// =========================================================

export function getJournalEntries({ contains } = {}) {
  const query = buildQuery({
    contains,
  });

  return clientRequest(`/accounting/journal-entries${query}`, {
    method: "GET",
  });
}

export function getJournalEntryById(id) {
  if (!id) throw new Error("Journal entry ID is required");

  return clientRequest(`/accounting/journal-entries/${id}`, {
    method: "GET",
  });
}

export function createJournalEntry(payload) {
  return clientRequest("/accounting/journal-entries", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateJournalEntry(id, payload) {
  if (!id) throw new Error("Journal entry ID is required");

  return clientRequest(`/accounting/journal-entries/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteJournalEntry(id) {
  if (!id) throw new Error("Journal entry ID is required");

  return clientRequest(`/accounting/journal-entries/${id}`, {
    method: "DELETE",
  });
}

// =========================================================
// ACCOUNTING MODULES
// =========================================================

export function getAccountingModules() {
  return clientRequest("/accounting/modules", {
    method: "GET",
  });
}

// =========================================================
// ACCOUNTING CLOSURES
// =========================================================

export function getAccountingClosures() {
  return clientRequest("/accounting/closures", {
    method: "GET",
  });
}

export function getAccountingClosureById(id) {
  if (!id) throw new Error("Accounting closure ID is required");

  return clientRequest(`/accounting/closures/${id}`, {
    method: "GET",
  });
}

export function createAccountingClosure(payload) {
  return clientRequest("/accounting/closures", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAccountingClosure(id, payload) {
  if (!id) throw new Error("Accounting closure ID is required");

  return clientRequest(`/accounting/closures/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteAccountingClosure(id) {
  if (!id) throw new Error("Accounting closure ID is required");

  return clientRequest(`/accounting/closures/${id}`, {
    method: "DELETE",
  });
}

// =========================================================
// ENTRY MODELS
// =========================================================

export function getEntryModels({ contains } = {}) {
  const query = buildQuery({
    contains,
  });

  return clientRequest(`/accounting/entry-models${query}`, {
    method: "GET",
  });
}

export function getEntryModelById(id) {
  if (!id) throw new Error("Entry model ID is required");

  return clientRequest(`/accounting/entry-models/${id}`, {
    method: "GET",
  });
}