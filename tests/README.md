# Tests

Este projeto utiliza o Bun como runtime de testes. Os testes estão organizados da seguinte forma:

## Estrutura de Testes

```
tests/
├── core/                 # Testes para módulos principais
│   └── prerequisites.test.ts
├── config/               # Testes para configuração
│   └── config.test.ts
├── ui/                   # Testes para interface de usuário
│   └── theme.test.ts
├── utils/                # Testes para utilitários
│   └── errors.test.ts
├── setup.ts              # Configuração inicial dos testes
└── README.md             # Esta documentação
```

## Executando os Testes

### Comandos Básicos

```bash
# Executar todos os testes
bun test

# Executar testes em modo watch
bun test:watch

# Executar testes com coverage
bun test:coverage
```

### Executando Testes Específicos

```bash
# Executar testes de um módulo específico
bun test tests/utils/errors.test.ts

# Executar testes com filtro por nome
bun test --grep "parseAiApiError"
```

## Estrutura dos Testes

### Testes de Utilitários (`utils/`)
- **errors.test.ts**: Testa o parsing de erros da API de IA

### Testes Principais (`core/`)
- **prerequisites.test.ts**: Testa verificação de pré-requisitos do sistema

### Testes de Configuração (`config/`)
- **config.test.ts**: Testa carregamento e validação de configurações

### Testes de Interface (`ui/`)
- **theme.test.ts**: Testa funcionalidade de cores e formatação

## Padrões de Teste

### Naming Convention
- Arquivos de teste devem terminar com `.test.ts`
- Testes devem ter nomes descritivos em inglês
- Use `describe` para agrupar testes relacionados
- Use `it` para casos de teste individuais

### Exemplo de Estrutura

```typescript
import { describe, it, expect } from "bun:test";
import { functionToTest } from "../../src/module";

describe("functionToTest", () => {
  it("should do something when condition is met", () => {
    // Arrange
    const input = "test";
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe("expected");
  });
});
```

## Mocking

Para testes que precisam de mocking, use a função `mock` do Bun:

```typescript
import { mock } from "bun:test";

const mockFunction = mock(() => "mocked value");
```

## Coverage

Os testes incluem coverage report que é gerado automaticamente quando você executa:

```bash
bun test --coverage
```

O coverage report mostra:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

## CI/CD

Os testes são executados automaticamente:
- Em todos os PRs
- Em pushes para `main` e `develop`
- Incluem verificação de coverage
- Falham se os testes não passarem

## Contribuindo

Ao adicionar novos recursos:
1. Adicione testes correspondentes
2. Mantenha coverage acima de 80%
3. Siga os padrões de naming
4. Documente testes complexos