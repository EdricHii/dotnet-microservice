using Microsoft.AspNetCore.Mvc;
using Play.Catalog.Service.Dtos;
using Play.Catalog.Contracts;
using FluentValidation;
using Play.Catalog.Service.Validators;
using Play.Catalog.Service;
using Play.Catalog.Service.Entities;
using MongoDB.Driver;
using Play.Common.Settings;
using Play.Common.MongoDB;
using Play.Common;
using Play.Common.MassTransit;
using MassTransit;
using MongoDB.Bson;
using MongoDB.Bson.Serialization;
using MongoDB.Bson.Serialization.Serializers;

BsonSerializer.RegisterSerializer(new GuidSerializer(BsonType.String));

var builder = WebApplication.CreateBuilder(args);

// Configure settings from appsettings.json
var serviceSettings = builder.Configuration.GetSection(nameof(ServiceSettings)).Get<ServiceSettings>()
    ?? throw new Exception("ServiceSettings configuration not found");

builder.Services
    .AddMongo()
    .AddMongoRepository<Item>("items")
    .AddMassTransitWithRabbitMQ();

// Add CORS policy
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy => policy
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddValidatorsFromAssemblyContaining<CreateItemDtoValidator>();
builder.Services.AddValidatorsFromAssemblyContaining<UpdateItemDtoValidator>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())

{
    app.UseSwagger();
    app.UseSwaggerUI();
}
else
{
    app.UseHttpsRedirection();
}

// Enable CORS for frontend
app.UseCors("AllowFrontend");

//Assign endpoint to var items
app.MapGet("/items", async (IRepository<Item> repository) =>
{
    var items = await repository.GetAllAsync();
    var itemsDto = items.Select(item => item.AsDto());

    return Results.Ok(itemsDto);
});

//Assign endpoint to get item by   {id} from var items
app.MapGet("/items/{id}", async (Guid id, IRepository<Item> repository) =>
{
    var item = await repository.GetByIdAsync(id);

    if (item is null)
    {
        return Results.NotFound();
    }
    return Results.Ok(item.AsDto());
});

//Post item to the list
app.MapPost("/items", async (CreateItemDto dto, IValidator<CreateItemDto> validator, IRepository<Item> repository, IPublishEndpoint publishEndpoint) =>
{
    var result = await validator.ValidateAsync(dto);
    if (!result.IsValid)
    {
        var errors = result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
        return Results.ValidationProblem(errors);
    }

    var item = new Item
    {
        Name = dto.Name,
        Description = dto.Description,
        Price = dto.Price,
        CreatedDate = DateTimeOffset.UtcNow
    }; await repository.CreateAsync(item);

    await publishEndpoint.Publish(new CatalogItemCreated(item.Id, item.Name, item.Description));

    var itemDto = item.AsDto();

    return Results.Created($"/items/{item.Id}", itemDto);
});

// Update item in the list
app.MapPut("/items/{id}", async (Guid id, UpdateItemDto dto, IValidator<UpdateItemDto> validator, IRepository<Item> repository, IPublishEndpoint publishEndpoint) =>
{
    var result = await validator.ValidateAsync(dto);
    if (!result.IsValid)
    {
        var errors = result.Errors
            .GroupBy(e => e.PropertyName)
            .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());
        return Results.ValidationProblem(errors);
    }

    var existingItem = await repository.GetByIdAsync(id);

    if (existingItem is null)
    {
        return Results.NotFound();
    }

    existingItem.Name = dto.Name;
    existingItem.Description = dto.Description;
    existingItem.Price = dto.Price;

    await repository.UpdateAsync(existingItem);

    await publishEndpoint.Publish(new CatalogItemUpdated(existingItem.Id, existingItem.Name, existingItem.Description));

    return Results.NoContent();
});

// Delete item from the list
app.MapDelete("/items/{id}", async (Guid id, IRepository<Item> repository, IPublishEndpoint publishEndpoint) =>
{
    var item = await repository.GetByIdAsync(id);

    if (item is null)
    {
        return Results.NotFound();
    }

    await repository.RemoveAsync(id);

    await publishEndpoint.Publish(new CatalogItemDeleted(id));

    return Results.NoContent();
});

app.Run();
