import dummyTasks from "../dummyTasks";
import { ScrollView, Text } from "react-native";

const TaskView = ({ started }) => {
    return (
        <ScrollView style={{ flex: 1, flexDirection: "column" }}>
            {dummyTasks.map((task) => {
                return (
                    <Text key={task.id} style={{ color: started ? "#fff" : "#111" }}>
                        {task.title}
                    </Text>
                );
            })}
        </ScrollView>
    );
};

export default TaskView;
