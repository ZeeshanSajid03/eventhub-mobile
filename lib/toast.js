import { Alert } from "react-native";

export const toast = {
  success: (message) => {
    Alert.alert("Success", message, [{ text: "OK" }]);
  },
  error: (message) => {
    Alert.alert("Error", message, [{ text: "OK" }]);
  },
  info: (message) => {
    Alert.alert("Info", message, [{ text: "OK" }]);
  },
  confirm: (title, message, onConfirm, onCancel) => {
    Alert.alert(title, message, [
      {
        text: "Cancel",
        style: "cancel",
        onPress: onCancel,
      },
      {
        text: "Confirm",
        style: "destructive",
        onPress: onConfirm,
      },
    ]);
  },
};