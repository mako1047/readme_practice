import { useEffect, useState } from "react";
import Keyboard from "./../../../keyboard-layout-creator/keyboard/src/App";
import "./style.css";
// @ts-ignore
import script from "./script";

import "bootstrap/dist/css/bootstrap.min.css";
import { Button, ProgressBar, Stack } from "react-bootstrap";

// import Editor from "@monaco-editor/react";

export default function Basic() {
  const [content, setContent] = useState<string>("a");
  const [now, setNow] = useState<number>(0);
  const [code, setCode] = useState<string>(
    '<!DOCTYPE html>\n<html lang="ja">\n\t<head>\n\t\t<meta charset="utf-8" />\n\t\t<title>Title</title>\n\t</head>\n\t<body>\n\t\tHello <a href="https://www.google.com/"><strong>World</strong></a>!\n\t</body>\n</html>'
  );

  useEffect(() => {
    script(now, setNow, code, setCode);
  }, []);
  const cont = document.getElementById("content");
  if (cont !== null) cont.textContent = content;
  return (
    <>
      {/* ここからHTMLファイル */}
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

          <div id="rawcode">
            {/* <Editor
              // height="20vh"
              defaultLanguage="html"
              defaultValue={code}
              theme="vs-dark"
            /> */}
          </div>

          <div id="preview-box">
            {/* addcodeを画面に表示したものを入れる */}
          </div>

          <Stack gap={0} id="progress">
            <div id="progress-number"></div>
            <div className="pb-5" id="progress-bar">
              <ProgressBar
                variant="success"
                animated
                now={now}
                label={`${now}%`}
              />
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
      <Button href="/" variant="secondary">
        Back
      </Button>
      {/* ここまでHTMLファイル */}
      {/* 下のdivの中にReactがキーボードの入力結果をいい感じにして、出力している。これを、読み取って使えば良い。 */}
      <div id="content"></div>
      <Keyboard
        element={
          <>
            キーボード配列を自分で作りたい人は、
            <a href="https://keyboard-layout-creator.onrender.com/">
              このリンク
            </a>
            に飛んでください。
          </>
        }
        output={content}
        setOutput={setContent}
      />
    </>
  );
}
