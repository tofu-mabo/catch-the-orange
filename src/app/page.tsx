"use client";

import { useEffect, useRef, useState } from "react";

export default function Page() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<number>(0);
  const [playerX, setPlayerX] = useState<number>(250);
  const [items, setItems] = useState<
    { x: number; y: number; bonus: boolean }[]
  >([]);
  const [health, setHealth] = useState<number>(100); // 体力を100に設定
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [dropSpeed, setDropSpeed] = useState<number>(4); // 落下スピードの初期値
  const [spawnInterval, setSpawnInterval] = useState<number>(1000); // アイテム出現間隔（初期値1秒）
  const [canvasWidth, setCanvasWidth] = useState<number>(500); // 初期値500、useEffectで更新
  const [canvasHeight, setCanvasHeight] = useState<number>(500); // 初期値500、useEffectで更新
  const playerWidth = 75; // 1.5倍に拡大
  const playerHeight = 75; // 1.5倍に拡大
  const positionFromBottom = 200;
  const itemSize = 30;
  const bonusItemSize = 45; // orangesのサイズを1.5倍に変更
  const playerImage = useRef<HTMLImageElement | null>(null);
  const normalItemImage = useRef<HTMLImageElement | null>(null);
  const bonusItemImage = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCanvasWidth(window.innerWidth);
      setCanvasHeight(window.innerHeight - 100);
      const handleResize = () => {
        setCanvasWidth(window.innerWidth);
        setCanvasHeight(window.innerHeight - 100);
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  useEffect(() => {
    // 画像を読み込む
    playerImage.current = new Image();
    playerImage.current.src = "/player.png";
    normalItemImage.current = new Image();
    normalItemImage.current.src = "/orange.jpeg";
    bonusItemImage.current = new Image();
    bonusItemImage.current.src = "/oranges.jpg";
  }, []);

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      const isBonus = Math.random() < 0.1; // 10%の確率でボーナスアイテム
      setItems((prevItems) => [
        ...prevItems,
        {
          x:
            Math.random() *
            (canvasWidth - (isBonus ? bonusItemSize : itemSize)),
          y: 0,
          bonus: isBonus,
        },
      ]);
    }, spawnInterval);
    return () => clearInterval(interval);
  }, [gameOver, spawnInterval, canvasWidth]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      if (gameOver) return; // ゲームオーバーなら更新しない

      setItems((prevItems) => {
        let newItems = prevItems.map((item) => ({
          ...item,
          y: item.y + dropSpeed,
        }));
        let missedCount = 0;

        newItems = newItems.filter((item) => {
          const itemSizeToUse = item.bonus ? bonusItemSize : itemSize;
          const playerY = canvasHeight - playerHeight - positionFromBottom;
          const caught =
            item.y + itemSizeToUse >= playerY &&
            item.x + itemSizeToUse >= playerX &&
            item.x <= playerX + playerWidth;

          if (caught) {
            const newScore = score + (item.bonus ? 5 : 1);
            setScore(newScore);
            setHealth((prev) => Math.min(100, prev + (item.bonus ? 15 : 5))); // 体力回復

            // スコアが30増えるごとに落下スピードを50%アップ、アイテム出現間隔を短縮
            if (newScore % 30 === 0) {
              setDropSpeed((prevSpeed) => prevSpeed * 1.5);
              setSpawnInterval((prevInterval) =>
                Math.max(200, prevInterval * 0.8)
              );
            }

            return false; // キャッチしたアイテムは削除
          }

          if (item.y >= canvasHeight) {
            missedCount++;
          }

          return item.y < canvasHeight;
        });

        // 画面下に落ちたアイテムの分だけ体力を減少
        if (missedCount > 0) {
          setHealth((prev) => Math.max(0, prev - missedCount * 10));
        }

        return newItems;
      });

      if (health <= 0) {
        setGameOver(true);
        return;
      }

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // 体力ゲージの描画
      ctx.fillStyle = "green";
      ctx.fillRect(10, 10, (canvasWidth - 20) * (health / 100), 20);
      ctx.strokeStyle = "black";
      ctx.strokeRect(10, 10, canvasWidth - 20, 20);

      // 落ちてくるアイテムを描画
      items.forEach((item) => {
        if (item.bonus && bonusItemImage.current) {
          ctx.drawImage(
            bonusItemImage.current,
            item.x,
            item.y,
            bonusItemSize,
            bonusItemSize
          );
        } else if (normalItemImage.current) {
          ctx.drawImage(
            normalItemImage.current,
            item.x,
            item.y,
            itemSize,
            itemSize
          );
        }
      });

      // プレイヤーを画像で描画
      if (playerImage.current) {
        ctx.drawImage(
          playerImage.current,
          playerX,
          canvasHeight - playerHeight - positionFromBottom,
          playerWidth,
          playerHeight
        );
      }

      animationFrameId = requestAnimationFrame(update);
    };

    animationFrameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animationFrameId);
  }, [playerX, items, health, gameOver, dropSpeed, canvasWidth, canvasHeight]);

  return (
    <div
      onMouseMove={(e) => setPlayerX(e.clientX - playerWidth / 2)}
      onTouchMove={(e) => setPlayerX(e.touches[0].clientX - playerWidth / 2)}
      style={{
        textAlign: "center",
        width: "100dvw",
        height: "90dvh",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "10px" }}>
        <h1>Get Ultra Orange!</h1>
        <p>Score: {score} UO</p>
        {gameOver ? <h2>Game Over</h2> : <p>Health: {health}</p>}
      </div>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{ border: "1px solid black", width: "100dvw", height: "90dvh" }}
      />
    </div>
  );
}
