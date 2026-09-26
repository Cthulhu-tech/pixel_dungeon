# UI projection / Проекция UI

createUiModel creates one vanilla Zustand store per application. Only the shell gets publish;
consumers get getSnapshot/subscribe. It holds phase only, not HP, inventory or the map.
Frozen runtime snapshots cannot be changed by a consumer; this is not content JSON freezing.

RU: один владелец записи, отписка каждого потребителя при shutdown. Старый controller после
dispose больше не публикует. Проверка actual XState/Zustand — tests/application/shell.test.mjs.
