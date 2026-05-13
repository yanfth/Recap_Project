import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [firstNum, setFirstNum] = useState("");
  const [operator, setOperator] = useState("");
  const [waitingNext, setWaitingNext] = useState(false);

  const handleNumber = (num: string) => {
    if (waitingNext) {
      setDisplay(num);
      setWaitingNext(false);
    } else {
      setDisplay(display === "0" ? num : display + num);
    }
  };

  const handleOperator = (op: string) => {
    setFirstNum(display);
    setOperator(op);
    setWaitingNext(true);
  };

  const handleEquals = () => {
    const a = parseFloat(firstNum);
    const b = parseFloat(display);
    let result = 0;
    if (operator === "+") result = a + b;
    if (operator === "-") result = a - b;
    if (operator === "×") result = a * b;
    if (operator === "÷") result = b !== 0 ? a / b : 0;
    setDisplay(String(result));
    setFirstNum("");
    setOperator("");
    setWaitingNext(true);
  };

  const handleClear = () => {
    setDisplay("0");
    setFirstNum("");
    setOperator("");
    setWaitingNext(false);
  };

  const Button = ({ label, onPress, type = "default" }: any) => (
    <TouchableOpacity
      style={[
        styles.btn,
        type === "operator" && styles.btnOp,
        type === "equals" && styles.btnEq,
        type === "clear" && styles.btnClear,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.btnText, type === "default" && styles.btnTextDark]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.displayBox}>
        <Text style={styles.operatorText}>
          {firstNum ? `${firstNum} ${operator}` : ""}
        </Text>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      <View style={styles.grid}>
        <Button label="AC" onPress={handleClear} type="clear" />
        <Button
          label="+/-"
          onPress={() => setDisplay(String(parseFloat(display) * -1))}
          type="operator"
        />
        <Button
          label="%"
          onPress={() => setDisplay(String(parseFloat(display) / 100))}
          type="operator"
        />
        <Button label="÷" onPress={() => handleOperator("÷")} type="operator" />

        <Button label="7" onPress={() => handleNumber("7")} />
        <Button label="8" onPress={() => handleNumber("8")} />
        <Button label="9" onPress={() => handleNumber("9")} />
        <Button label="×" onPress={() => handleOperator("×")} type="operator" />

        <Button label="4" onPress={() => handleNumber("4")} />
        <Button label="5" onPress={() => handleNumber("5")} />
        <Button label="6" onPress={() => handleNumber("6")} />
        <Button label="-" onPress={() => handleOperator("-")} type="operator" />

        <Button label="1" onPress={() => handleNumber("1")} />
        <Button label="2" onPress={() => handleNumber("2")} />
        <Button label="3" onPress={() => handleNumber("3")} />
        <Button label="+" onPress={() => handleOperator("+")} type="operator" />

        <Button label="0" onPress={() => handleNumber("0")} />
        <Button
          label="."
          onPress={() => {
            if (!display.includes(".")) setDisplay(display + ".");
          }}
        />
        <Button
          label="⌫"
          onPress={() =>
            setDisplay(display.length > 1 ? display.slice(0, -1) : "0")
          }
        />
        <Button label="=" onPress={handleEquals} type="equals" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  displayBox: {
    width: 340,
    padding: 16,
    alignItems: "flex-end",
    marginBottom: 8,
  },
  operatorText: { color: "#888", fontSize: 20, marginBottom: 4 },
  displayText: { color: "#fff", fontSize: 72, fontWeight: "200" },
  grid: {
    width: 340,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  btn: {
    width: 72,
    height: 72,
    borderRadius: 999,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
  },
  btnOp: { backgroundColor: "#FF9F0A" },
  btnEq: { backgroundColor: "#FF9F0A" },
  btnClear: { backgroundColor: "#a5a5a5" },
  btnText: { fontSize: 28, color: "#fff", fontWeight: "400" },
  btnTextDark: { color: "#fff" },
});
