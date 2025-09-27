using FluentValidation;
using Play.Catalog.Service.Dtos;

namespace Play.Catalog.Service.Validators
{
    public class CreateItemDtoValidator : AbstractValidator<CreateItemDto>
    {
        public CreateItemDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Name is required.");

            RuleFor(x => x.Price)
                .InclusiveBetween(0, 1000)
                .WithMessage("Price must be between 0 and 1000.");
        }
    }
}
