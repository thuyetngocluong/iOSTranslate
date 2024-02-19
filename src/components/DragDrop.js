import React, { useState } from "react";
import { FileUploader } from "react-drag-drop-files";
import * as XLSX from 'xlsx';
import JSZip from 'jszip';


const fileTypes = ["xlsx"];

function DragDrop() {
  const [file, setFile] = useState(null);
  const handleChange = (file) => {
    let reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target.result;
      const workbook =     XLSX.read(content)
      let sheet1 = workbook.Sheets.Sheet1

      let dictionary = (() => {

        let result = {}

        const columnsHasValues = [];
        const range = XLSX.utils.decode_range(sheet1['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = { c: C, r: range.s.r }; // Assuming headers are in the first row
          const headerCell = XLSX.utils.encode_cell(cellAddress);
          const columnHeader = sheet1[headerCell] ? sheet1[headerCell].v : undefined;
          if (columnHeader) {
            columnsHasValues.push(String.fromCharCode("A".charCodeAt(0) + C));
          }
        }

        for (let idx in columnsHasValues) {
          const columnToGet = columnsHasValues[idx]
          const columnValues = [];
          for (const cellAddress in sheet1) {
            if (cellAddress.startsWith(columnToGet)) {
              const cellValue = sheet1[cellAddress].v;
              columnValues.push({
                address: cellAddress,
                value: cellValue
              });
            }
          }
          result[columnToGet] = columnValues
        }

        return result


      })()

      setFile(dictionary)
      console.log("LOADED")
    }
    reader.readAsArrayBuffer(file)
  };

  const convertToCatalog = () => {

    let results = {
      "sourceLanguage": "en",
      "strings": {},
      "version": "1.0"
    }

    const copyFile = JSON.parse(JSON.stringify(file))
    delete copyFile["B"]
    const keys = Object.keys(copyFile)

    console.log(keys)

    const length = file["A"].length


    for (let idx = 3; idx < length; idx++) {
      let key = file["B"][idx].value
      if (!key || key.length === 0) {
        key = file["A"][idx].value
      }
      if (!results["strings"][key]) {
        results["strings"][key] = {
          "extractionState" : "manual",
          "localizations": {}
        }
      }
      for (let i = 0; i < keys.length; i++) {
        let translatedKey = keys[i]
        results["strings"][key]["localizations"][file[translatedKey][2].value] = {
          "stringUnit": {
            "state":"translated",
            "value": JSON.stringify(file[translatedKey][idx].value).replace(/^"|"$/g, '')
          }
        }
      }
    }

    // Create a blob with the file data
    const data = JSON.stringify(results);
    const blob = new Blob([data], { type: 'text/plain' });

    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a link element and simulate a click on it
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Localizable.xcstrings';
    document.body.appendChild(link);
    link.click();

    // Clean up the URL and link
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }

  const convertToZip = () => {

    console.log(file)

    const copyFile = JSON.parse(JSON.stringify(file))
    delete copyFile["B"]
    const keys = Object.keys(copyFile)

    const length = file["A"].length

    let zip = new JSZip()

    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]
      let folder = zip.folder(`${file[key][2].value}.lproj`)
      let data = []
      for (let idx = 3; idx < length; idx++) {
        let k = file["B"][idx].value
        if (!k || k.length === 0) {
          k = file["A"][idx].value
        }

        data.push(`"${k}"=${JSON.stringify(file[key][idx].value)};`)
      }

      folder.file("Localizable.strings", data.join("\n"))
    }



    zip.generateAsync({ type: 'blob' }).then(blob => {
      // Create a temporary link to trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'result.zip';
      document.body.appendChild(link);
      link.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    });
  }

  const convertRemoteConfigLocalization = () => {

    let results = {
      "items": {},
    }

    const copyFile = JSON.parse(JSON.stringify(file))
    delete copyFile["B"]
    const keys = Object.keys(copyFile)

    const length = file["A"].length


    for (let i = 0; i < keys.length; i++) {
      let key = keys[i]
      let languageCode = file[key][2].value
      let data = []
      for (let idx = 3; idx < length; idx++) {
        let k = file["B"][idx].value
        if (!k || k.length === 0) {
          k = file["A"][idx].value
        }

        data.push({
          key: k,
          value: file[key][idx].value,
          caseSensitive: false
        })
      }

      results["items"][languageCode] = data
    }



    const data = JSON.stringify(results);
    const blob = new Blob([data], { type: 'application/json' });

    // Create a URL for the blob
    const url = window.URL.createObjectURL(blob);

    // Create a link element and simulate a click on it
    const link = document.createElement('a');
    link.href = url;
    link.download = 'result.json';
    document.body.appendChild(link);
    link.click();

    // Clean up the URL and link
    window.URL.revokeObjectURL(url);
    document.body.removeChild(link);
  }


  return (
    <div className="App">
      <FileUploader handleChange={handleChange} name="file" multiply={false} types={fileTypes}/>
      <button className="Button" onClick={convertToCatalog} disabled={file == null}>String Catalog</button>
      <button className="Button" onClick={convertToZip} disabled={file == null}>Zip File</button>
      <button className="Button" onClick={convertRemoteConfigLocalization} disabled={file == null}>Remote Config</button>
    </div>
  );
}

export default DragDrop;