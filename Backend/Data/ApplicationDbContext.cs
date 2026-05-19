using Backend.Models.AI;
using Backend.Models.Admin;
using Backend.Models.Credits;
using Backend.Models.Customers;
using Backend.Models.Inventory;
using Backend.Models.Notifications;
using Backend.Models.Purchasing;
using Backend.Models.Requests;
using Backend.Models.Reviews;
using Backend.Models.Sales;
using Backend.Models.Service;
using Backend.Models.Suppliers;
using Backend.Models.Users;
using Backend.Models.Vehicles;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public sealed class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    public DbSet<UserSession> UserSessions => Set<UserSession>();

    public DbSet<Customer> Customers => Set<Customer>();

    public DbSet<Staff> Staff => Set<Staff>();

    public DbSet<CustomerNotificationSettings> CustomerNotificationSettings => Set<CustomerNotificationSettings>();

    public DbSet<CustomerNote> CustomerNotes => Set<CustomerNote>();

    public DbSet<Vehicle> Vehicles => Set<Vehicle>();

    public DbSet<Appointment> Appointments => Set<Appointment>();

    public DbSet<ServiceRecord> ServiceRecords => Set<ServiceRecord>();

    public DbSet<Order> Orders => Set<Order>();

    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    public DbSet<SalesInvoice> SalesInvoices => Set<SalesInvoice>();

    public DbSet<SalesInvoiceItem> SalesInvoiceItems => Set<SalesInvoiceItem>();

    public DbSet<CreditTransaction> CreditTransactions => Set<CreditTransaction>();

    public DbSet<PartRequest> PartRequests => Set<PartRequest>();

    public DbSet<Review> Reviews => Set<Review>();

    public DbSet<UserNotification> UserNotifications => Set<UserNotification>();

    public DbSet<AIPrediction> AIPredictions => Set<AIPrediction>();

    public DbSet<Vendor> Vendors => Set<Vendor>();

    public DbSet<PartCategory> PartCategories => Set<PartCategory>();

    public DbSet<Part> Parts => Set<Part>();

    public DbSet<PurchaseInvoice> PurchaseInvoices => Set<PurchaseInvoice>();

    public DbSet<PurchaseInvoiceItem> PurchaseInvoiceItems => Set<PurchaseInvoiceItem>();

    public DbSet<AdminNotification> AdminNotifications => Set<AdminNotification>();

    public DbSet<AdminSettings> AdminSettings => Set<AdminSettings>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.HasDefaultSchema("public");

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users", table =>
            {
                table.HasCheckConstraint(
                    "CK_Users_Role",
                    "\"Role\" IN ('Admin', 'Staff', 'Customer')");
            });

            entity.HasKey(user => user.Id);

            entity.Property(user => user.Id)
                .ValueGeneratedOnAdd();

            entity.Property(user => user.FullName)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(user => user.Email)
                .HasColumnType("varchar(255)")
                .HasMaxLength(255)
                .IsRequired();

            entity.HasIndex(user => user.Email)
                .IsUnique();

            entity.Property(user => user.PasswordHash)
                .HasColumnType("varchar(255)")
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(user => user.Role)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(user => user.IsActive)
                .HasDefaultValue(true)
                .IsRequired();

            entity.Property(user => user.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();
        });

        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.ToTable("UserSessions");

            entity.HasKey(session => session.Id);

            entity.Property(session => session.Id)
                .ValueGeneratedOnAdd();

            entity.Property(session => session.JwtId)
                .HasColumnType("varchar(80)")
                .HasMaxLength(80)
                .IsRequired();

            entity.HasIndex(session => session.JwtId)
                .IsUnique();

            entity.HasIndex(session => new { session.UserId, session.ExpiresAtUtc });

            entity.Property(session => session.UserAgent)
                .HasColumnType("varchar(500)")
                .HasMaxLength(500);

            entity.Property(session => session.IpAddress)
                .HasColumnType("varchar(80)")
                .HasMaxLength(80);

            entity.Property(session => session.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.Property(session => session.ExpiresAtUtc)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            entity.Property(session => session.RevokedAt)
                .HasColumnType("timestamp with time zone");

            entity.HasOne(session => session.User)
                .WithMany(user => user.Sessions)
                .HasForeignKey(session => session.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.ToTable("Customers");

            entity.HasKey(customer => customer.Id);

            entity.Property(customer => customer.Id)
                .ValueGeneratedOnAdd();

            entity.Property(customer => customer.UserId)
                .IsRequired();

            entity.HasIndex(customer => customer.UserId)
                .IsUnique();

            entity.HasOne(customer => customer.User)
                .WithOne(user => user.Customer)
                .HasForeignKey<Customer>(customer => customer.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.Property(customer => customer.Phone)
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .IsRequired();

            entity.HasIndex(customer => customer.Phone);

            entity.Property(customer => customer.Address)
                .HasColumnType("text");

            entity.Property(customer => customer.DateOfBirth)
                .HasColumnType("date");

            entity.Property(customer => customer.NidNumber)
                .HasColumnName("NIDNumber")
                .HasColumnType("varchar(50)")
                .HasMaxLength(50);

            entity.Property(customer => customer.AvatarUrl)
                .HasColumnType("varchar(500)")
                .HasMaxLength(500);

            entity.Property(customer => customer.CreditLimit)
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0m)
                .IsRequired();

            entity.Property(customer => customer.CreditBalance)
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0m)
                .IsRequired();

            entity.Property(customer => customer.TotalSpend)
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0m)
                .IsRequired();

            entity.Property(customer => customer.LoyaltyPoints)
                .HasDefaultValue(0)
                .IsRequired();

            entity.Property(customer => customer.VisitCount)
                .HasDefaultValue(0)
                .IsRequired();

            entity.Property(customer => customer.LastVisit)
                .HasColumnType("timestamp with time zone");

            entity.Property(customer => customer.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();
        });

        modelBuilder.Entity<Staff>(entity =>
        {
            entity.ToTable("Staff", table =>
            {
                table.HasCheckConstraint(
                    "CK_Staff_StaffRole",
                    "\"StaffRole\" IN ('SalesStaff', 'Manager')");
            });

            entity.HasKey(staff => staff.Id);

            entity.Property(staff => staff.Id)
                .ValueGeneratedOnAdd();

            entity.Property(staff => staff.UserId)
                .IsRequired();

            entity.HasIndex(staff => staff.UserId)
                .IsUnique();

            entity.HasOne(staff => staff.User)
                .WithOne(user => user.Staff)
                .HasForeignKey<Staff>(staff => staff.UserId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.Property(staff => staff.StaffRole)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(staff => staff.PhoneNumber)
                .HasColumnType("varchar(20)")
                .HasMaxLength(20);

            entity.Property(staff => staff.JoinDate)
                .HasColumnType("date")
                .IsRequired();

            entity.Property(staff => staff.IsActive)
                .HasDefaultValue(true)
                .IsRequired();
        });

        modelBuilder.Entity<CustomerNotificationSettings>(entity =>
        {
            entity.ToTable("CustomerNotificationSettings");

            entity.HasKey(settings => settings.Id);

            entity.Property(settings => settings.Id)
                .ValueGeneratedOnAdd();

            entity.Property(settings => settings.CustomerId)
                .IsRequired();

            entity.HasIndex(settings => settings.CustomerId)
                .IsUnique();

            entity.HasOne(settings => settings.Customer)
                .WithOne(customer => customer.NotificationSettings)
                .HasForeignKey<CustomerNotificationSettings>(settings => settings.CustomerId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.Property(settings => settings.EmailInvoices)
                .HasDefaultValue(true)
                .IsRequired();

            entity.Property(settings => settings.AppointmentReminders)
                .HasDefaultValue(true)
                .IsRequired();

            entity.Property(settings => settings.AiAlerts)
                .HasDefaultValue(true)
                .IsRequired();

            entity.Property(settings => settings.PromotionalOffers)
                .HasDefaultValue(false)
                .IsRequired();

            entity.Property(settings => settings.OverdueReminders)
                .HasDefaultValue(true)
                .IsRequired();

            entity.Property(settings => settings.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();
        });

        modelBuilder.Entity<CustomerNote>(entity =>
        {
            entity.ToTable("CustomerNotes");

            entity.HasKey(note => note.Id);

            entity.Property(note => note.Id)
                .ValueGeneratedOnAdd();

            entity.Property(note => note.Body)
                .HasColumnType("text")
                .IsRequired();

            entity.HasIndex(note => note.CustomerId);

            entity.Property(note => note.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.HasOne(note => note.Customer)
                .WithMany(customer => customer.Notes)
                .HasForeignKey(note => note.CustomerId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.HasOne(note => note.AuthorUser)
                .WithMany(user => user.AuthoredCustomerNotes)
                .HasForeignKey(note => note.AuthorUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.ToTable("Vehicles", table =>
            {
                table.HasCheckConstraint("CK_Vehicles_Year", "\"Year\" BETWEEN 1900 AND 2100");
            });

            entity.HasKey(vehicle => vehicle.Id);

            entity.Property(vehicle => vehicle.Id)
                .ValueGeneratedOnAdd();

            entity.Property(vehicle => vehicle.Make)
                .HasColumnType("varchar(120)")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(vehicle => vehicle.Model)
                .HasColumnType("varchar(120)")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(vehicle => vehicle.Year)
                .IsRequired();

            entity.Property(vehicle => vehicle.Plate)
                .HasColumnType("varchar(40)")
                .HasMaxLength(40)
                .IsRequired();

            entity.HasIndex(vehicle => vehicle.Plate)
                .IsUnique();

            entity.HasIndex(vehicle => vehicle.CustomerId);

            entity.Property(vehicle => vehicle.Color)
                .HasColumnType("varchar(80)")
                .HasMaxLength(80);

            entity.Property(vehicle => vehicle.FuelType)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20);

            entity.Property(vehicle => vehicle.PhotoUrl)
                .HasColumnType("varchar(500)")
                .HasMaxLength(500);

            entity.Property(vehicle => vehicle.Status)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .HasDefaultValue(VehicleStatus.Active)
                .IsRequired();

            entity.Property(vehicle => vehicle.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.Property(vehicle => vehicle.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.HasOne(vehicle => vehicle.Customer)
                .WithMany(customer => customer.Vehicles)
                .HasForeignKey(vehicle => vehicle.CustomerId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity<Appointment>(entity =>
        {
            entity.ToTable("Appointments");

            entity.HasKey(appointment => appointment.Id);

            entity.Property(appointment => appointment.Id)
                .ValueGeneratedOnAdd();

            entity.Property(appointment => appointment.ServiceType)
                .HasColumnType("varchar(120)")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(appointment => appointment.ScheduledAt)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            entity.Property(appointment => appointment.Status)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .HasDefaultValue(AppointmentStatus.Pending)
                .IsRequired();

            entity.Property(appointment => appointment.Notes)
                .HasColumnType("text");

            entity.Property(appointment => appointment.Technician)
                .HasColumnType("varchar(120)")
                .HasMaxLength(120);

            entity.Property(appointment => appointment.Cost)
                .HasColumnType("decimal(18,2)");

            entity.Property(appointment => appointment.HasReview)
                .HasDefaultValue(false)
                .IsRequired();

            entity.HasIndex(appointment => new { appointment.CustomerId, appointment.ScheduledAt });
            entity.HasIndex(appointment => new { appointment.VehicleId, appointment.ScheduledAt });
            entity.HasIndex(appointment => appointment.Status);

            entity.Property(appointment => appointment.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.Property(appointment => appointment.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.HasOne(appointment => appointment.Customer)
                .WithMany(customer => customer.Appointments)
                .HasForeignKey(appointment => appointment.CustomerId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.HasOne(appointment => appointment.Vehicle)
                .WithMany(vehicle => vehicle.Appointments)
                .HasForeignKey(appointment => appointment.VehicleId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
        });

        modelBuilder.Entity<ServiceRecord>(entity =>
        {
            entity.ToTable("ServiceRecords");

            entity.HasKey(record => record.Id);

            entity.Property(record => record.Id)
                .ValueGeneratedOnAdd();

            entity.Property(record => record.Date)
                .HasColumnType("timestamp with time zone")
                .IsRequired();

            entity.Property(record => record.ServiceType)
                .HasColumnType("varchar(120)")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(record => record.Technician)
                .HasColumnType("varchar(120)")
                .HasMaxLength(120)
                .IsRequired();

            entity.Property(record => record.Cost)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(record => record.Notes)
                .HasColumnType("text");

            entity.HasIndex(record => new { record.CustomerId, record.Date });

            entity.Property(record => record.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.HasOne(record => record.Customer)
                .WithMany(customer => customer.ServiceRecords)
                .HasForeignKey(record => record.CustomerId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.HasOne(record => record.Vehicle)
                .WithMany(vehicle => vehicle.ServiceRecords)
                .HasForeignKey(record => record.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Vendor>(entity =>
        {
            entity.ToTable("Vendors");

            entity.HasKey(vendor => vendor.Id);

            entity.Property(vendor => vendor.Id)
                .ValueGeneratedOnAdd();

            entity.Property(vendor => vendor.Name)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200)
                .IsRequired();

            entity.HasIndex(vendor => vendor.Name);

            entity.Property(vendor => vendor.ContactPerson)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200);

            entity.Property(vendor => vendor.Phone)
                .HasColumnType("varchar(20)")
                .HasMaxLength(20);

            entity.Property(vendor => vendor.Email)
                .HasColumnType("varchar(255)")
                .HasMaxLength(255);

            entity.Property(vendor => vendor.Address)
                .HasColumnType("text");

            entity.Property(vendor => vendor.Notes)
                .HasColumnType("text");

            entity.Property(vendor => vendor.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.Property(vendor => vendor.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();
        });

        modelBuilder.Entity<PartCategory>(entity =>
        {
            entity.ToTable("PartCategories");

            entity.HasKey(category => category.Id);

            entity.Property(category => category.Id)
                .ValueGeneratedOnAdd();

            entity.Property(category => category.Name)
                .HasColumnType("varchar(120)")
                .HasMaxLength(120)
                .IsRequired();

            entity.HasIndex(category => category.Name)
                .IsUnique();

            entity.Property(category => category.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();
        });

        modelBuilder.Entity<Part>(entity =>
        {
            entity.ToTable("Parts");

            entity.HasKey(part => part.Id);

            entity.Property(part => part.Id)
                .ValueGeneratedOnAdd();

            entity.Property(part => part.Name)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200)
                .IsRequired();

            entity.HasIndex(part => part.Name);

            entity.Property(part => part.PartNumber)
                .HasColumnType("varchar(100)")
                .HasMaxLength(100);

            entity.HasIndex(part => part.PartNumber)
                .IsUnique()
                .HasFilter("\"PartNumber\" IS NOT NULL");

            entity.Property(part => part.Description)
                .HasColumnType("text");

            entity.Property(part => part.ImageUrl)
                .HasColumnType("varchar(500)")
                .HasMaxLength(500);

            entity.Property(part => part.CompatibleModels)
                .HasColumnType("text[]")
                .HasDefaultValueSql("ARRAY[]::text[]")
                .IsRequired();

            entity.Property(part => part.Popularity)
                .HasDefaultValue(0)
                .IsRequired();

            entity.Property(part => part.UnitPrice)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(part => part.StockQuantity)
                .HasDefaultValue(0)
                .IsRequired();

            entity.Property(part => part.ReorderLevel)
                .HasDefaultValue(5)
                .IsRequired();

            entity.Property(part => part.IsActive)
                .HasDefaultValue(true)
                .IsRequired();

            entity.HasIndex(part => part.IsActive);

            entity.Property(part => part.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.Property(part => part.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.HasOne(part => part.Category)
                .WithMany(category => category.Parts)
                .HasForeignKey(part => part.CategoryId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();

            entity.HasOne(part => part.Vendor)
                .WithMany(vendor => vendor.Parts)
                .HasForeignKey(part => part.VendorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");

            entity.HasKey(order => order.Id);

            entity.Property(order => order.Id)
                .ValueGeneratedOnAdd();

            entity.Property(order => order.OrderNumber)
                .HasColumnType("varchar(40)")
                .HasMaxLength(40)
                .IsRequired();

            entity.HasIndex(order => order.OrderNumber)
                .IsUnique();

            entity.HasIndex(order => new { order.CustomerId, order.CreatedAt });
            entity.HasIndex(order => order.Status);

            entity.Property(order => order.Subtotal)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(order => order.Discount)
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0m)
                .IsRequired();

            entity.Property(order => order.Total)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(order => order.Status)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .HasDefaultValue(OrderStatus.Pending)
                .IsRequired();

            entity.Property(order => order.DeliveryType)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .HasDefaultValue(OrderDeliveryType.Pickup)
                .IsRequired();

            entity.Property(order => order.PaymentMethod)
                .HasConversion<string>()
                .HasColumnType("varchar(30)")
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(order => order.DeliveryAddress)
                .HasColumnType("text");

            entity.Property(order => order.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.Property(order => order.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.HasOne(order => order.Customer)
                .WithMany(customer => customer.Orders)
                .HasForeignKey(order => order.CustomerId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems");

            entity.HasKey(item => item.Id);

            entity.Property(item => item.Id)
                .ValueGeneratedOnAdd();

            entity.Property(item => item.PartName)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(item => item.Quantity)
                .IsRequired();

            entity.Property(item => item.UnitPrice)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(item => item.Subtotal)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.HasOne(item => item.Order)
                .WithMany(order => order.Items)
                .HasForeignKey(item => item.OrderId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.HasOne(item => item.Part)
                .WithMany(part => part.OrderItems)
                .HasForeignKey(item => item.PartId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
        });

        modelBuilder.Entity<SalesInvoice>(entity =>
        {
            entity.ToTable("SalesInvoices");

            entity.HasKey(invoice => invoice.Id);

            entity.Property(invoice => invoice.Id)
                .ValueGeneratedOnAdd();

            entity.Property(invoice => invoice.InvoiceNumber)
                .HasColumnType("varchar(40)")
                .HasMaxLength(40)
                .IsRequired();

            entity.HasIndex(invoice => invoice.InvoiceNumber)
                .IsUnique();

            entity.HasIndex(invoice => new { invoice.CustomerId, invoice.CreatedAt });
            entity.HasIndex(invoice => invoice.Status);

            entity.Property(invoice => invoice.WalkInName)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200);

            entity.Property(invoice => invoice.StaffName)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(invoice => invoice.Status)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .HasDefaultValue(InvoiceStatus.Paid)
                .IsRequired();

            entity.Property(invoice => invoice.PaymentMethod)
                .HasConversion<string>()
                .HasColumnType("varchar(30)")
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(invoice => invoice.Subtotal)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(invoice => invoice.Discount)
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(0m)
                .IsRequired();

            entity.Property(invoice => invoice.Total)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(invoice => invoice.Notes)
                .HasColumnType("text");

            entity.Property(invoice => invoice.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.Property(invoice => invoice.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.HasOne(invoice => invoice.Customer)
                .WithMany(customer => customer.SalesInvoices)
                .HasForeignKey(invoice => invoice.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(invoice => invoice.Vehicle)
                .WithMany(vehicle => vehicle.SalesInvoices)
                .HasForeignKey(invoice => invoice.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(invoice => invoice.Staff)
                .WithMany(staff => staff.SalesInvoices)
                .HasForeignKey(invoice => invoice.StaffId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<SalesInvoiceItem>(entity =>
        {
            entity.ToTable("SalesInvoiceItems");

            entity.HasKey(item => item.Id);

            entity.Property(item => item.Id)
                .ValueGeneratedOnAdd();

            entity.Property(item => item.PartNumber)
                .HasColumnType("varchar(100)")
                .HasMaxLength(100);

            entity.Property(item => item.PartName)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(item => item.Quantity)
                .IsRequired();

            entity.Property(item => item.UnitPrice)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(item => item.Subtotal)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(item => item.StockBefore)
                .IsRequired();

            entity.Property(item => item.StockAfter)
                .IsRequired();

            entity.HasOne(item => item.SalesInvoice)
                .WithMany(invoice => invoice.Items)
                .HasForeignKey(item => item.SalesInvoiceId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.HasOne(item => item.Part)
                .WithMany(part => part.SalesInvoiceItems)
                .HasForeignKey(item => item.PartId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
        });

        modelBuilder.Entity<CreditTransaction>(entity =>
        {
            entity.ToTable("CreditTransactions");

            entity.HasKey(transaction => transaction.Id);

            entity.Property(transaction => transaction.Id)
                .ValueGeneratedOnAdd();

            entity.Property(transaction => transaction.Date)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired();

            entity.Property(transaction => transaction.Type)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(transaction => transaction.Notes)
                .HasColumnType("text");

            entity.Property(transaction => transaction.Amount)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(transaction => transaction.BalanceAfter)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.HasIndex(transaction => new { transaction.CustomerId, transaction.Date });

            entity.HasOne(transaction => transaction.Customer)
                .WithMany(customer => customer.CreditTransactions)
                .HasForeignKey(transaction => transaction.CustomerId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.HasOne(transaction => transaction.SalesInvoice)
                .WithMany(invoice => invoice.CreditTransactions)
                .HasForeignKey(transaction => transaction.SalesInvoiceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<PurchaseInvoice>(entity =>
        {
            entity.ToTable("PurchaseInvoices");

            entity.HasKey(invoice => invoice.Id);

            entity.Property(invoice => invoice.Id)
                .ValueGeneratedOnAdd();

            entity.Property(invoice => invoice.InvoiceNumber)
                .HasColumnType("varchar(40)")
                .HasMaxLength(40)
                .IsRequired();

            entity.HasIndex(invoice => invoice.InvoiceNumber)
                .IsUnique();

            entity.Property(invoice => invoice.TotalCost)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(invoice => invoice.Notes)
                .HasColumnType("text");

            entity.Property(invoice => invoice.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.HasOne(invoice => invoice.Vendor)
                .WithMany(vendor => vendor.PurchaseInvoices)
                .HasForeignKey(invoice => invoice.VendorId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();

            entity.HasOne(invoice => invoice.CreatedByUser)
                .WithMany()
                .HasForeignKey(invoice => invoice.CreatedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<PurchaseInvoiceItem>(entity =>
        {
            entity.ToTable("PurchaseInvoiceItems");

            entity.HasKey(item => item.Id);

            entity.Property(item => item.Id)
                .ValueGeneratedOnAdd();

            entity.Property(item => item.PartName)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(item => item.Quantity)
                .IsRequired();

            entity.Property(item => item.UnitCost)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(item => item.Subtotal)
                .HasColumnType("decimal(18,2)")
                .IsRequired();

            entity.Property(item => item.StockBefore)
                .IsRequired();

            entity.Property(item => item.StockAfter)
                .IsRequired();

            entity.HasOne(item => item.PurchaseInvoice)
                .WithMany(invoice => invoice.LineItems)
                .HasForeignKey(item => item.PurchaseInvoiceId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.HasOne(item => item.Part)
                .WithMany(part => part.PurchaseInvoiceItems)
                .HasForeignKey(item => item.PartId)
                .OnDelete(DeleteBehavior.Restrict)
                .IsRequired();
        });

        modelBuilder.Entity<PartRequest>(entity =>
        {
            entity.ToTable("PartRequests");

            entity.HasKey(request => request.Id);

            entity.Property(request => request.Id)
                .ValueGeneratedOnAdd();

            entity.Property(request => request.PartName)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(request => request.PartNumber)
                .HasColumnType("varchar(100)")
                .HasMaxLength(100);

            entity.Property(request => request.Description)
                .HasColumnType("text");

            entity.Property(request => request.ImageUrl)
                .HasColumnType("varchar(500)")
                .HasMaxLength(500);

            entity.Property(request => request.Status)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .HasDefaultValue(PartRequestStatus.Pending)
                .IsRequired();

            entity.HasIndex(request => new { request.CustomerId, request.CreatedAt });
            entity.HasIndex(request => request.Status);

            entity.Property(request => request.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.Property(request => request.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.HasOne(request => request.Customer)
                .WithMany(customer => customer.PartRequests)
                .HasForeignKey(request => request.CustomerId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.HasOne(request => request.Vehicle)
                .WithMany(vehicle => vehicle.PartRequests)
                .HasForeignKey(request => request.VehicleId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.ToTable("Reviews", table =>
            {
                table.HasCheckConstraint("CK_Reviews_Rating", "\"Rating\" BETWEEN 1 AND 5");
            });

            entity.HasKey(review => review.Id);

            entity.Property(review => review.Id)
                .ValueGeneratedOnAdd();

            entity.Property(review => review.Rating)
                .IsRequired();

            entity.Property(review => review.Title)
                .HasColumnType("varchar(160)")
                .HasMaxLength(160);

            entity.Property(review => review.Body)
                .HasColumnType("text")
                .IsRequired();

            entity.Property(review => review.Status)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .HasDefaultValue(ReviewStatus.Pending)
                .IsRequired();

            entity.Property(review => review.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.HasIndex(review => new { review.CustomerId, review.CreatedAt });
            entity.HasIndex(review => review.Status);

            entity.HasOne(review => review.Customer)
                .WithMany(customer => customer.Reviews)
                .HasForeignKey(review => review.CustomerId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();

            entity.HasOne(review => review.Appointment)
                .WithOne(appointment => appointment.Review)
                .HasForeignKey<Review>(review => review.AppointmentId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<UserNotification>(entity =>
        {
            entity.ToTable("UserNotifications");

            entity.HasKey(notification => notification.Id);

            entity.Property(notification => notification.Id)
                .ValueGeneratedOnAdd();

            entity.Property(notification => notification.Audience)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(notification => notification.Type)
                .HasConversion<string>()
                .HasColumnType("varchar(30)")
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(notification => notification.Title)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(notification => notification.Message)
                .HasColumnType("text")
                .IsRequired();

            entity.Property(notification => notification.IsRead)
                .HasDefaultValue(false)
                .IsRequired();

            entity.Property(notification => notification.Link)
                .HasColumnType("varchar(300)")
                .HasMaxLength(300);

            entity.Property(notification => notification.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();

            entity.HasIndex(notification => new { notification.UserId, notification.IsRead });
            entity.HasIndex(notification => new { notification.Audience, notification.IsRead });

            entity.HasOne(notification => notification.User)
                .WithMany(user => user.Notifications)
                .HasForeignKey(notification => notification.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        modelBuilder.Entity<AIPrediction>(entity =>
        {
            entity.ToTable("AIPredictions");

            entity.HasKey(prediction => prediction.Id);

            entity.Property(prediction => prediction.Id)
                .ValueGeneratedOnAdd();

            entity.Property(prediction => prediction.PartName)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(prediction => prediction.RiskLevel)
                .HasConversion<string>()
                .HasColumnType("varchar(20)")
                .HasMaxLength(20)
                .IsRequired();

            entity.Property(prediction => prediction.RecommendedAction)
                .HasColumnType("text")
                .IsRequired();

            entity.Property(prediction => prediction.EstimatedFailureWindow)
                .HasColumnType("varchar(120)")
                .HasMaxLength(120);

            entity.Property(prediction => prediction.PredictedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .IsRequired();

            entity.HasIndex(prediction => new { prediction.CustomerId, prediction.PredictedAt });
            entity.HasIndex(prediction => new { prediction.VehicleId, prediction.RiskLevel });

            entity.HasOne(prediction => prediction.Customer)
                .WithMany(customer => customer.AIPredictions)
                .HasForeignKey(prediction => prediction.CustomerId)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired();

            entity.HasOne(prediction => prediction.Vehicle)
                .WithMany(vehicle => vehicle.AIPredictions)
                .HasForeignKey(prediction => prediction.VehicleId)
                .OnDelete(DeleteBehavior.Cascade)
                .IsRequired();
        });

        modelBuilder.Entity<AdminNotification>(entity =>
        {
            entity.ToTable("AdminNotifications");

            entity.HasKey(notification => notification.Id);

            entity.Property(notification => notification.Id)
                .ValueGeneratedOnAdd();

            entity.Property(notification => notification.Type)
                .HasColumnType("varchar(30)")
                .HasMaxLength(30)
                .IsRequired();

            entity.Property(notification => notification.Message)
                .HasColumnType("text")
                .IsRequired();

            entity.Property(notification => notification.IsRead)
                .HasDefaultValue(false)
                .IsRequired();

            entity.HasIndex(notification => notification.IsRead);

            entity.Property(notification => notification.CreatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();
        });

        modelBuilder.Entity<AdminSettings>(entity =>
        {
            entity.ToTable("AdminSettings");

            entity.HasKey(settings => settings.Id);

            entity.Property(settings => settings.Id)
                .ValueGeneratedOnAdd();

            entity.Property(settings => settings.CompanyName)
                .HasColumnType("varchar(200)")
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(settings => settings.CompanyAddress)
                .HasColumnType("text");

            entity.Property(settings => settings.CurrencySymbol)
                .HasColumnType("varchar(5)")
                .HasMaxLength(5)
                .HasDefaultValue("$")
                .IsRequired();

            entity.Property(settings => settings.LowStockThreshold)
                .HasDefaultValue(10)
                .IsRequired();

            entity.Property(settings => settings.LoyaltyDiscountThreshold)
                .HasColumnType("decimal(18,2)")
                .HasDefaultValue(5000m)
                .IsRequired();

            entity.Property(settings => settings.LoyaltyDiscountPercentage)
                .HasColumnType("decimal(5,2)")
                .HasDefaultValue(10m)
                .IsRequired();

            entity.Property(settings => settings.UpdatedAt)
                .HasColumnType("timestamp with time zone")
                .HasDefaultValueSql("now()")
                .ValueGeneratedOnAdd()
                .IsRequired();
        });
    }
}
