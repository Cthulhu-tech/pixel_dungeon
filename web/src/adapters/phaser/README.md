# Phaser adapter / Отображение

Один Phaser4 WebGL canvas. SmokeScene — инфраструктурный пример, не исходный GameScene.
Оригинальный amulet texture используется без генерации/перерисовки. Project shaders —
shaders/original-sprite.{vert,frag}.glsl, импорт raw без source strings/patching в TS.
Scene subscriptions и keyboard listeners снимаются при SHUTDOWN. Общая texture живёт в game
scope; повторный scene preload не загружает её снова. Shell-команды не содержат правил боя.

English: ShaderQuad currently displays one original texture. No browser rendering claim is
made from typecheck/build. Input, orientation, alpha and restart must pass the human checklist.
Full tile batching/frames/bitmap fonts and original UI remain separate PLAN work.
