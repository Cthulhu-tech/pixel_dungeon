# Ручная проверка инфраструктуры / Human browser acceptance

Статус: NOT_RUN. Исполнитель: человек, не агент/Playwright. Записать commit, браузер/OS,
logical viewport/DPR, console и screenshots. Это не приёмка полной игры.

1. Собрать `npm run build`, запустить `npm run preview` и открыть страницу вручную.
2. Один canvas, оригинальный amulet без переворота/ореола/размытия. Весь статус и controls
   внутри canvas; никаких внешних HTML игровых элементов. Сверить исходный PNG.
3. Toggle и Space меняют Ready/Paused ровно один раз. Restart возвращает Ready после загрузки.
4. Повторить restart 20 раз: один canvas, нет удвоенных input/subscriptions, console чиста.
5. Отдельно проверить production base path, WebGL context loss/restore и ошибку asset load.
   При ошибке нельзя получить READY или бесконечную загрузку. Зафиксировать результат.
6. HMR/unmount: старые сцены не реагируют, второй renderer не создаётся до удаления первого.

English: Human-only checklist. Record revision and environment. A passed compile does not
prove pixels, input, sound, cleanup, context restoration or full game parity. Leave any item
without evidence explicitly NOT_VERIFIED; do not automatically accept screenshots.
