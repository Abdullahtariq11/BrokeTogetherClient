import React, { useContext, useState } from 'react'
import { Alert, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { AuthContext } from '../context/AuthContext';

function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const { login, isLoading } = useContext(AuthContext);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }
        try {
            await login(email, password);
        } catch (error) {
            Alert.alert("Login Failed", err.toString());
        }
    }
    return (
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-background">
            <View className="flex-1">
                <Text>
                    djncdskc
                </Text>
            </View>
        </SafeAreaView>
    )
}

export default LoginScreen