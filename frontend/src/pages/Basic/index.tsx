import { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import Keyboard from "../KeyboardLayoutCreator/Keyboard"
import "./style.css"

import "bootstrap/dist/css/bootstrap.min.css"
import { Button, ProgressBar, Stack } from "react-bootstrap"

export default function Basic() {
  const [content, setContent] = useState<string>("a")
  const [now, setNow] = useState<number>(0)
  // const [wordnum, setWordnum] = useState<number>(0)
  // const [questions, setQuestions] = useState<string[]>([])
  const [isStarted, setIsStarted] = useState<boolean>(false)
  const [time, setTime] = useState(0) // 現在の時間
  const [timeLimit] = useState(12) // 制限時間

  let wordnum = 0 // 何問目か
  let correct = 0 // 正答文字数
  let miss = 0 // ミスタイプ数
  let cnt = 0 // 何文字目か
  let isFinished = false // 終わったか

  const correctSE: HTMLAudioElement = new Audio("/correctSE.mp3")
  const qnumber: number = Number(localStorage.getItem("qnumber")) || 0
  let questions: string[] = []

  const Navigate = useNavigate()

  // 配列をシャッフルする関数
  const shuffle = (array: string[]): string[] => {
    for (let i = 0; i < array.length; i++) {
      const j = Math.floor(Math.random() * array.length)
      ;[array[i], array[j]] = [array[j], array[i]]
    }
    return array
  }

  // scoreを計算する関数
  const calcScore = (time: number, wordnum: number, correct: number, miss: number, velocity: number) => {
    // 使う変数
    const progress = wordnum / questions.length
    const diff = 0
    const correct_rate = correct ** 2 / (miss + correct + 1) // 問題文字数多いと有利！
    if (velocity > 10) velocity = 10

    // 重みをつけて算出
    const w1 = 1000
    const w2 = 0 // 難易度は未実装
    const w3 = 1
    const w4 = 5
    return Math.floor(w1 * progress * (w2 * diff + w3 * correct_rate + w4 * velocity))
  }

  async function results(time: number, wordnum: number, correct: number, miss: number) {
    let velocity
    if (time === 0) velocity = 99.99
    else velocity = correct / time
    const score = calcScore(time, wordnum, correct, miss, velocity)
    const kpm = Math.floor(velocity * Math.pow(10, 2)) / Math.pow(10, 2) // kpmじゃなくてkpsだった...
    let scorerank
    if (miss === 0 && kpm >= 5 && wordnum === questions.length) scorerank = "SS"
    else if (correct / (correct + miss + 1) > 0.9 && kpm >= 5 && wordnum === questions.length) scorerank = "S"
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
    Navigate("/result")
  }

  useEffect(() => {
    // 問題をquestionsに格納する
    ;(async () => {
      const json = JSON.stringify({
        qnumber: qnumber,
      })
      const response = await fetch(`${import.meta.env.VITE_API_ENDPOINT}/questions`, {
        method: "post",
        headers: { "Content-Type": "application/json" },
        body: json,
      })
      const data: string[] = JSON.parse(await response.text())
      if (qnumber <= 5) questions = shuffle(data) // 順番が無関係な問題のみシャッフル
      else questions = data
    })()
  }, [])

  let timerId: NodeJS.Timeout | any
  const updateTime = () => {
    console.log(typeof timerId)
    timerId =
      !timerId &&
      setInterval(() => {
        setTime((prev) => prev + 1)
      }, 1000)

    if (timeLimit - time <= 0 && !isFinished) {
      console.log(typeof timerId)
      clearInterval(timerId)
      isFinished = true
      results(time, wordnum, correct, miss)
    }
  }

  // 初回はisStartedが変更されたら実行。その後はtimeが変更されたら実行。
  useEffect(() => {
    if (!isStarted) return
    updateTime()

    return () => clearInterval(timerId)
  }, [isStarted, time])

  useEffect(() => {
    async function main() {
      const keyInput = content[content.length - 1] // 追加された文字すなわち一番最後の文字を取り出す。

      // 何問目/全問題数を右上に表示
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document.getElementById("progress-number")!.textContent = wordnum + 1 + "/" + questions.length + "問"

      if (keyInput === questions[wordnum][cnt]) {
        // 正答時
        cnt++
        correct++
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        document.getElementById("correct")!.textContent = correct + "回"
      } else if (keyInput.match(/[a-zA-Z]/)) {
        // 間違えていたときでアルファベットであれば、不正解とする。
        // 不正解の時
        miss++
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        document.getElementById("miss")!.textContent = miss + "回"
      }

      if (cnt === questions[wordnum].length) {
        // 次の問題へ
        wordnum++

        // 正解音が鳴る。最後の問題だけちょっと切れている
        correctSE.pause()
        correctSE.play()

        // 進捗バーを増やす
        setNow(Math.round((wordnum / questions.length) * 100))

        cnt = 0
        if (wordnum === questions.length && isFinished === false) {
          // clearInterval(timerId)
          // 二重submitを防ぐflag
          isFinished = true
          results(time, wordnum, correct, miss)
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document.getElementById("answered")!.textContent = questions[wordnum].slice(0, cnt)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document.getElementById("question")!.textContent = questions[wordnum].slice(cnt)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document.getElementById("miss")!.textContent = miss + "回"
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      document.getElementById("correct")!.textContent = correct + "回"

      // 開始キーを押したら開始
      window.addEventListener("keydown", () => {
        if (!isStarted) setIsStarted(true)
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
    document.getElementById("correct")!.textContent = correct + "回"
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    document.getElementById("miss")!.textContent = miss + "回"
  }, [content])

  return (
    <>
      <Link to="/">
        <Button variant="secondary" id="backbutton">
          Back
        </Button>
      </Link>
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
                <td id="time">{time}秒</td>
              </tr>
              <tr>
                <th>残り時間：</th>
                <td id="remaining-time">{timeLimit - time}秒</td>
              </tr>
            </tbody>
          </table>

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
      <Keyboard output={content} setOutput={setContent} />
    </>
  )
}
