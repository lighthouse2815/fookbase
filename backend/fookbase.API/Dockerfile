FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY fookbase.API/fookbase.API.csproj fookbase.API/
RUN dotnet restore fookbase.API/fookbase.API.csproj

COPY . .
WORKDIR /src/fookbase.API
RUN dotnet publish fookbase.API.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8081
EXPOSE 8081

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "fookbase.API.dll"]
