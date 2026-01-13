# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /app

# Copy csproj files
COPY Project.Api/*.csproj ./Project.Api/
COPY Project.Core/*.csproj ./Project.Core/
COPY Project.Service/*.csproj ./Project.Service/

# Restore dependencies
WORKDIR /app
RUN dotnet restore Project.Api/Project.Api.csproj

# Copy source code
COPY . .

# Build
RUN dotnet publish Project.Api/Project.Api.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app

# Copy published app
COPY --from=build /app/publish .

# Create Logs directory
RUN mkdir -p /app/Logs

# Set environment to Production
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=1 \
  CMD curl -f http://localhost:5000/health || exit 1

EXPOSE 5000

ENTRYPOINT ["dotnet", "Project.Api.dll"]
