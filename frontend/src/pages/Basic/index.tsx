import React from "react"
import { useEffect, useState, Dispatch, SetStateAction } from "react"
import Keyboard from "../KeyboardLayoutCreator/Keyboard"
import "./style.css"

import "bootstrap/dist/css/bootstrap.min.css"
import { Button, ProgressBar, Stack } from "react-bootstrap"

export default function Basic() {
  const [content, setContent] = useState<string>("a")
  const [now, setNow] = useState<number>(0)

  useEffect(() => {
    async function script(now: number, setNow: Dispatch<SetStateAction<number>>) {
      let questions: string[] = [] // 問題
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let timerId: any //clearIntervalをするため

      const correctSE = new Audio("/correctSE.mp3")

      // 問題をquestionsに格納する関数
      const getQuestions = async () => {
        const json = JSON.stringify({
          qnumber: localStorage.getItem("qnumber") || 0,
        })
        const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/questions`, {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: json,
        })
        questions = JSON.parse(await response.text())
      }

      // 配列をシャッフルする関数
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const shuffle = (array: any[]) => {
        for (let i = 0; i < array.length; i++) {
          const j = Math.floor(Math.random() * array.length)
          ;[array[i], array[j]] = [array[j], array[i]]
        }
        return array
      }

      // scoreを計算する関数
      const calcScore = (time: number, word_num: number, correct: number, miss: number, velocity: number) => {
        // 使う変数
        const progress = word_num / questions.length
        const diff = 0
        const correct_rate = correct ** 2 / (miss + correct + 1) // 問題文字数多いと有利！
        if (velocity > 10) velocity = 10

        // 重みをつけて算出
        const w1 = 1000
        const w2 = 0.1
        const w3 = 1
        const w4 = 5
        return Math.floor(w1 * progress * (w2 * diff + w3 * correct_rate + w4 * velocity))
      }

      const qnumber = Number(localStorage.getItem("qnumber") || 0)

      async function results(time: number, word_num: number, correct: number, miss: number) {
        let velocity
        if (time === 0) velocity = 99.99
        else velocity = correct / time
        const score = calcScore(time, word_num, correct, miss, velocity)
        const kpm = Math.floor(velocity * Math.pow(10, 2)) / Math.pow(10, 2) // kpmじゃなくてkpsだった...
        let scorerank
        if (miss === 0 && kpm >= 5 && word_num === questions.length) scorerank = "SS"
        else if (correct / (correct + miss + 1) > 0.9 && kpm >= 5 && word_num === questions.length) scorerank = "S"
        else if (correct / (correct + miss + 1) > 0.8 && kpm >= 4) scorerank = "A"
        else if (correct / (correct + miss + 1) > 0.8 && kpm >= 3) scorerank = "B"
        else if (correct / (correct + miss + 1) < 0.5) scorerank = "E"
        else if (correct / (correct + miss + 1) > 0.7 && kpm >= 2) scorerank = "C"
        else scorerank = "D"

        const json = JSON.stringify({
          qnumber: qnumber,
          username: localStorage.getItem("username") || "Guest",
          score: score,
        })
        await fetch(`${import.meta.env.VITE_API_ENDPOINT}/submitScore`, {
          method: "post",
          headers: { "Content-Type": "application/json" },
          body: json,
        })

        localStorage.setItem("time", time.toString())
        localStorage.setItem("score", score.toString())
        localStorage.setItem("kpm", kpm.toString())
        localStorage.setItem("correct", correct.toString())
        localStorage.setItem("miss", miss.toString())
        localStorage.setItem("scorerank", scorerank)
        window.location.href = "/result"
      }

      async function main() {
        // 問題をとってくる
        await getQuestions()
        // シャッフルする、ただし順番が無関係な問題のみ
        if (qnumber <= 5) {
          questions = shuffle(questions)
        }
        const alphabet = [
          "a",
          "b",
          "c",
          "d",
          "e",
          "f",
          "g",
          "h",
          "i",
          "j",
          "k",
          "l",
          "m",
          "n",
          "o",
          "p",
          "q",
          "r",
          "s",
          "t",
          "u",
          "v",
          "w",
          "x",
          "y",
          "z",
        ]
        function start() {
          if (isStarted === false) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            document.getElementById("question")!.textContent = questions[word_num]
            // スペースが押されたら、時間計測
            isStarted = true
            timerId = setInterval(() => {
              time++
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              document.getElementById("time")!.textContent = time + "秒"
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              document.getElementById("remaining-time")!.textContent = timeLimit - time + "秒"

              if (timeLimit - time <= 0 && isFinished === false) {
                clearInterval(timerId)
                isFinished = true
                results(time, word_num, correct, miss)
              }
            }, 1000)
          }
        }

        // キーボードの入力をReactがdivの中に出力しているので、その変更が行われたのを読み取っている。
        const observer = new MutationObserver(() => {
          start()
          const previousContent = content
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          content = document.getElementById("content")!.textContent
          if (content !== null) {
            const key = content[content.length - 1] // 追加された文字すなわち一番最後の文字を取り出す。

            if (content === previousContent) return

            // 何問目/全問題数を右上に表示
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            document.getElementById("progress-number")!.textContent = word_num + 1 + "/" + questions.length + "問"

            if (key === questions[word_num][cnt]) {
              // 正答時
              answer += key
              cnt++
              correct++
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              document.getElementById("correct")!.textContent = correct + "回"
            } else if (alphabet.includes(key.toLowerCase())) {
              // 間違えていたときでアルファベットであれば、不正解とする。
              // 不正解の時
              miss++
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              document.getElementById("miss")!.textContent = miss + "回"
            }

            if (cnt == questions[word_num].length) {
              // 次の問題へ
              word_num++

              // 正解音が鳴る。最後の問題だけちょっと切れている
              correctSE.pause()
              correctSE.play()

              // 進捗バーを増やす
              setNow(Math.round((word_num / questions.length) * 100))

              answer = ""
              cnt = 0
              if (word_num === questions.length && isFinished === false) {
                // 二重submitを防ぐflag
                isFinished = true
                results(time, word_num, correct, miss)
              }
            }

            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            document.getElementById("answered")!.textContent = questions[word_num].slice(0, cnt)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            document.getElementById("question")!.textContent = questions[word_num].slice(cnt)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            document.getElementById("miss")!.textContent = miss + "回"
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            document.getElementById("correct")!.textContent = correct + "回"
          }
        })
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        observer.observe(document.getElementById("content")!, {
          attributes: true,
          childList: true,
          subtree: true,
        })

        window.addEventListener("keydown", () => {
          start()
        })
      }
      main()

      /*const content = document.getElementById("content");
  if (content != null) {
    const content = content.textContent;
  }
  if (content.length > 2) {
    content = content.slice(content.length-11,content.length-1);
  }
  console.log(content)*/

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      let content = document.getElementById("content")!.textContent

      // 一旦このエラーを無視 後でちゃんと直しましょう。
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let answer = "" // 入力された文字列
      let word_num = 0 // 何問目か
      let correct = 0 // 正答文字数
      let miss = 0 // ミスタイプ数
      let cnt = 0 // 何文字目か
      let isStarted = false // 始まったか
      let isFinished = false // 終わったか
      let time = 0 // 時間
      const timeLimit = 120 // 制限時間

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document.getElementById("correct")!.textContent = correct + "回"
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document.getElementById("miss")!.textContent = miss + "回"
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document.getElementById("time")!.textContent = time + "秒"
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document.getElementById("remaining-time")!.textContent = timeLimit - time + "秒"
    }
    script(now, setNow)
  }, [])
  const cont = document.getElementById("content")
  if (cont !== null) cont.textContent = content

  return (
    <>
      <Button href="/" variant="secondary" id="backbutton">
        Back
      </Button>
      <div id="score-related">
        <Stack direction="horizontal" gap={3}>
          <table id="current">
            <tbody>
              <tr>
                <th>正しいタイプ数：</th>
                <td id="correct"></td>
              </tr>
              <tr>
                <th>ミスタイプ数：</th>
                <td id="miss"></td>
              </tr>
              <tr>
                <th>経過時間：</th>
                <td id="time"></td>
              </tr>
              <tr>
                <th>残り時間：</th>
                <td id="remaining-time"></td>
              </tr>
            </tbody>
          </table>
          <pre>
            <div id="rawcode"></div>
          </pre>
          <div id="preview-box"></div>

          <Stack gap={0} id="progress">
            <div id="progress-number"></div>
            <div className="pb-5" id="progress-bar">
              <ProgressBar variant="success" animated now={now} label={`${now}%`} />
            </div>
          </Stack>
        </Stack>
      </div>
      <div id="elements">
        <div id="answer">
          <span id="answered"></span>
          <span id="question">[Space]を押して開始</span>
        </div>
      </div>
      {/* 下のdivの中にReactがキーボードの入力結果をいい感じにして、出力している。これを、読み取って使えば良い。 */}
      <div id="content"></div>
      <Keyboard output={content} setOutput={setContent} />
    </>
  )
}