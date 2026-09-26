# Run result descriptions / Описания исходов

Public API: `resultDescription` from `index.ts`; declarations: `types/run/result.d.ts`.
Own trusted data: `assets/result-descriptions.en.json`, extracted verbatim from original
ResultDescriptions.java at ce7f241515fd5c040fcf18b4beb5b7a49d9d535f. It retains source
placeholders and wording. This is the content boundary, not yet a complete run coordinator.

Описание исхода имеет одного владельца; effects передают причину через порт, а не собирают
копии сообщений в каждой реализации. Запрос не изменяет данные и не использует браузер.
Форматирование и реальный fail/save/UI вызывающего приложения ещё должны быть интегрированы.
Java resource-effects oracle uses the original ResultDescriptions and validates referenced
messages in its event stream. It does not prove a completed ending screen or full run save.

Extraction requires only this module, owner declarations and JSON with resolveJsonModule.
