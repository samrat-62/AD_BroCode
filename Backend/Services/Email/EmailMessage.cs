namespace Backend.Services.Email;

public sealed record EmailMessage(
    string To,
    string Subject,
    string Body,
    bool IsHtml = false);

public sealed record LowStockAlertEmail(
    string PartName,
    string? PartNumber,
    int CurrentStock,
    int ReorderLevel,
    string? VendorName);
