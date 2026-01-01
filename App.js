import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
// import { Feather } from "@react-native-vector-icons/feather";
import StartButton from "./Components/StartButton";
import dummyTasks from "./dummyTasks";
import TaskView from "./Components/TaskView";
export default function App() {
    const [started, setStarted] = useState(false);
    return (
        <View style={[styles.container, { backgroundColor: !started ? "#fff" : "#111" }]}>
            <Text style={[styles.header, { color: !started ? "#111" : "#fff" }]}>TO.DO.IT</Text>
            <View style={{ alignItems: "center" }}>
                <StartButton hasStarted={started} stop={() => setStarted(false)} start={() => setStarted(true)} />
            </View>
            <TaskView started={started} />
            <StatusBar style="auto" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#111",
        paddingVertical: 30,
        paddingHorizontal: 20,
        flex: 1,
    },
    header: {
        color: "#fff",
    },
});
