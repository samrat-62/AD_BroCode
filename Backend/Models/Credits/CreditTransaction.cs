using Backend.Models.Sales;
using Backend.Models.Users;

namespace Backend.Models.Credits;

public sealed class CreditTransaction
{
    public Guid Id { get; set; }

    public Guid CustomerId { get; set; }

    public Guid? SalesInvoiceId { get; set; }

    public DateTimeOffset Date { get; set; } = DateTimeOffset.UtcNow;

    public CreditTransactionType Type { get; set; } = CreditTransactionType.Charge;

    public string? Notes { get; set; }

    public decimal Amount { get; set; }

    public decimal BalanceAfter { get; set; }

    public Customer Customer { get; set; } = null!;

    public SalesInvoice? SalesInvoice { get; set; }
}
