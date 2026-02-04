
# Plano: Ajustar ícones do Dashboard para ficar igual à página de Entradas

## Objetivo
Atualizar o estilo dos ícones nos cards de estatísticas do Dashboard para ter a mesma aparência da página de Entradas (Reports).

## Mudanças no Dashboard (`src/pages/Dashboard.tsx`)

### Antes (Dashboard atual)
```tsx
<div className={`${stat.bgColor} p-3 rounded-xl`}>
  <stat.icon className={`h-6 w-6 ${stat.color}`} />
</div>
```

### Depois (igual ao Entradas)

**1. Saldo Disponível** - Ícone com círculo e borda verde (como o "Valor Aprovado"):
```tsx
<div className="h-7 w-7 flex items-center justify-center border-2 border-primary rounded-full">
  <Wallet className="h-4 w-4 text-primary" strokeWidth={1.5} />
</div>
```

**2. Faturamento Total** - Ícone com círculo e borda verde:
```tsx
<div className="h-7 w-7 flex items-center justify-center border-2 border-success rounded-full">
  <DollarSign className="h-4 w-4 text-success" strokeWidth={1.5} />
</div>
```

**3. Vendas Aprovadas** - Ícone simples verde (como "Número de Vendas"):
```tsx
<div className="h-7 w-7 flex items-center justify-center">
  <ShoppingCart className="h-6 w-6 text-success" strokeWidth={1.5} />
</div>
```

**4. Taxa de Conversão** - Ícone simples verde (como "Taxa de Conversão"):
```tsx
<div className="h-7 w-7 flex items-center justify-center">
  <TrendingUp className="h-6 w-6 text-success" strokeWidth={1.5} />
</div>
```

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/pages/Dashboard.tsx` | Atualizar estrutura dos ícones nos stats cards para usar o estilo da página de Entradas (borda circular ou ícone simples) |

## Detalhes Técnicos

- Remover as props `bgColor` do array `dashboardStats`
- Atualizar o componente de renderização para usar estilos condicionais por card
- Usar `strokeWidth={1.5}` para ícones mais finos (igual Entradas)
- Manter tamanho `h-7 w-7` para o container e `h-6 w-6` ou `h-4 w-4` para ícones
