import React, { useContext } from 'react';
import { View, PanResponder } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export default function ActivityTracker({ children }) {
    const { resetInactivityTimer, userToken } = useContext(AuthContext);

    const panResponder = React.useRef(
        PanResponder.create({
            onStartShouldSetPanResponderCapture: () => {
                if (userToken && resetInactivityTimer) {
                    resetInactivityTimer();
                }
                return false; // Let touches pass through
            },
        })
    ).current;

    return (
        <View style={{ flex: 1 }} {...panResponder.panHandlers}>
            {children}
        </View>
    );
}