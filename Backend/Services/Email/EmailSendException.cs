namespace Backend.Services.Email;

public sealed class EmailSendException : Exception
{
    public EmailSendException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}
