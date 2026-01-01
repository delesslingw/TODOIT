import { useEffect, useState } from "react";
import { TouchableOpacity, Text } from "react-native";
import { Feather } from "@react-native-vector-icons/feather";
const StartButton = ({ stop, start }) => {
    const [startTime, setStartTime] = useState(null);
    const [elapsedMs, setElapsedMs] = useState(0);
    const started = startTime !== null;
    const handleStartPress = () => {
        if (!started) {
            setStartTime(new Date());
            start();
        } else {
            setStartTime(null);
            setElapsedMs(0);
            stop();
        }
    };
    const totalMs = 60 * 1000 * 25;
    useEffect(() => {
        if (!started) return;

        const interval = setInterval(() => {
            setElapsedMs(Date.now() - startTime.getTime());
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const minutes = Math.floor((totalMs - elapsedMs) / 60000);
    const seconds = Math.floor(((totalMs - elapsedMs) % 60000) / 1000);
    return (
        <TouchableOpacity
            style={[
                !started
                    ? {
                          backgroundColor: "#aaa",
                      }
                    : {
                          backgroundColor: "#fff",
                      },
                { justifyContent: "center", alignItems: "center", width: 200, height: 200, borderRadius: 200 },
            ]}
            onPress={handleStartPress}
        >
            {startTime == null ? (
                <Feather name="play" size={50} color="#fff"></Feather>
            ) : (
                <Text style={{ color: "#111", fontSize: 30 }}>{`${minutes}m ${seconds}s`}</Text>
            )}
        </TouchableOpacity>
    );
};

export default StartButton;
