# Rex input adapter

Use the exact published plugins/button.js entry. The full UI plugin imports declarations
for unsupported unused components; do not restore that barrel without strict compatibility.
bindCommandButton adopts the passed display target for the rest of its lifetime. Its disposer
removes the command listener, destroys the component AND target (which removes vendor pointer
listeners). The same target is not reused after dispose. Rules remain in the command owner.

RU: rex распознаёт ввод, но не владеет игровыми данными. Объект отображения уничтожается вместе
с привязкой. Полные окна/компоненты оригинала переносятся отдельно без подмены оформления.
