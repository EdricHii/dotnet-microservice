using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;
using Play.Common;
using Play.Common.MassTransit;
using Play.Common.MongoDB;
using Play.Inventory.Service;
using Play.Inventory.Service.Clients;
using Play.Inventory.Service.Dtos;
using Play.Inventory.Service.Entities;
using Polly;
using Polly.Extensions.Http;
using Polly.Timeout;

BsonSerializer.RegisterSerializer(new GuidSerializer(BsonType.String));

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddMongo()
                .AddMongoRepository<InventoryItem>("inventoryitems")
                .AddMongoRepository<CatalogItem>("catalogitems")
                .AddMassTransitWithRabbitMQ();

AddCatalogClient(builder);

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .AllowAnyOrigin() // For production, specify the allowed origins
            .AllowAnyMethod()
            .AllowAnyHeader()
    );
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Enable CORS
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

// Minimal API endpoints for inventory items

// GET /items/{userId} - Get all inventory items for a user
app.MapGet("/items", async (Guid userId, IRepository<InventoryItem> inventoryItemsRepository, IRepository<CatalogItem> catalogItemsRepository) =>
{
    if (userId == Guid.Empty)
    {
        return Results.BadRequest();
    }

    var inventoryItemEntities = await inventoryItemsRepository.GetAllAsync(item => item.UserId == userId);
    var itemIds = inventoryItemEntities.Select(item => item.CatalogItemId);
    var catalogItemEntities = await catalogItemsRepository.GetAllAsync(item => itemIds.Contains(item.Id));

    var inventoryItemDtos = inventoryItemEntities.Select(inventoryItem =>
    {
        var catalogItem = catalogItemEntities.Single(catalogItem => catalogItem.Id == inventoryItem.CatalogItemId);
        return inventoryItem.AsDto(catalogItem.Name, catalogItem.Description);
    });
    return Results.Ok(inventoryItemDtos);
});

app.MapPost("/items", async (GrantItemsDto grantItemsDto, IRepository<InventoryItem> itemsRepository) =>
{
    var inventoryItem = (await itemsRepository.GetAllAsync(item => item.UserId == grantItemsDto.UserId && item.CatalogItemId == grantItemsDto.CatalogItemId)).SingleOrDefault();
    if (inventoryItem == null)
    {
        inventoryItem = new InventoryItem
        {
            CatalogItemId = grantItemsDto.CatalogItemId,
            UserId = grantItemsDto.UserId,
            Quantity = grantItemsDto.Quantity,
            AcquiredDate = DateTimeOffset.UtcNow
        };
        await itemsRepository.CreateAsync(inventoryItem);
    }
    else
    {
        inventoryItem.Quantity += grantItemsDto.Quantity;
        await itemsRepository.UpdateAsync(inventoryItem);
    }
    return Results.Ok();
});


app.Run();

static void AddCatalogClient(WebApplicationBuilder builder)
{
    Random jitterer = new Random();

    builder.Services.AddHttpClient<CatalogClient>(client =>
    {
        client.BaseAddress = new Uri(builder.Configuration["CatalogService"] ?? "http://localhost:5001");
    })
    .AddTransientHttpErrorPolicy(policyBuilder =>
        policyBuilder.Or<TimeoutRejectedException>().WaitAndRetryAsync(
            5,
            retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt))
                            + TimeSpan.FromMilliseconds(jitterer.Next(0, 1000)),
            onRetry: (outcome, timespan, retryAttempt) =>
            {
                var serviceProvider = builder.Services.BuildServiceProvider();
                serviceProvider.GetService<ILogger<CatalogClient>>()?
                    .LogWarning($"Delaying for {timespan.TotalSeconds} seconds, then making retry {retryAttempt}");
            }
        ))
    .AddTransientHttpErrorPolicy(policyBuilder =>
        policyBuilder.Or<TimeoutRejectedException>().CircuitBreakerAsync(
            3,
            TimeSpan.FromSeconds(15),
            onBreak: (outcome, timespan) =>
            {
                var serviceProvider = builder.Services.BuildServiceProvider();
                serviceProvider.GetService<ILogger<CatalogClient>>()?
                    .LogWarning($"Opening the circuit for {timespan.TotalSeconds} seconds...");
            },
            onReset: () =>
            {
                var serviceProvider = builder.Services.BuildServiceProvider();
                serviceProvider.GetService<ILogger<CatalogClient>>()?
                    .LogWarning("Closing the circuit...");
            }
        ))
    .AddPolicyHandler(Policy.TimeoutAsync<HttpResponseMessage>(1));
}