// Utility function to format a date string into a readable format (e.g., "Jan 1, 2024")
// Used across the invoice tabs to display dates consistently.
export function formatDate(dateStr) {
    // If no date string is provided, return a dash placeholder
    if (!dateStr) return "-";

    // Append "T00:00:00" to avoid timezone shifts when parsing only the date part.
    // This ensures the date is interpreted as midnight in the local timezone.
    const date = new Date(dateStr + "T00:00:00");

    // Format the date to US English locale with short month name, numeric day, and full year.
    // Example output: "Jan 15, 2025"
    return date.toLocaleDateString("en-US", {
        month:  "short",   // "Jan", "Feb", "Mar", ...
        day:    "numeric", // 1, 2, 3, ...
        year:   "numeric", // 2024, 2025, ...
    });
}