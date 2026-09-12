# Mono Block

フレームループ型（`boot` / `update` / `draw`）のビジュアルプログラミング＋ゲーム制作 IDE。  
Scratch より、Pyxel のようなミニマルなゲームエンジン体験に近い設計です。

デモ: [https://sodahub99k.github.io/mono_block/](https://sodahub99k.github.io/mono_block/)

## モデル

- **エンティティ**はデータだけ（位置・速度・見た目）。スクリプトは持たない
- コードはゲーム全体で **boot（開始時） / update（毎フレーム） / draw（HUD）**
- 入力はポーリング（キーが押されている／今押された）
- シングルスレッド・同期実行（コルーチンやイベント hat なし）

## 開発

```bash
pnpm install
pnpm dev
```

## 公開

`main` へ push すると GitHub Actions が GitHub Pages にデプロイします。
