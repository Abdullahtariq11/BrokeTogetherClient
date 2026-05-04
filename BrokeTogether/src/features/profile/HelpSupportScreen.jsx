import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FAQS = [
  {
    question: 'How do I add a new expense?',
    answer:
      'Go to the Home tab and tap "Add Bill". Enter the amount, description, and select which members to split with.',
  },
  {
    question: 'How do I settle up with someone?',
    answer:
      'Tap "Settle Up" on the Home tab. You\'ll see who owes you and who you owe. Tap on a member to record a settlement.',
  },
  {
    question: 'How do I invite someone to my household?',
    answer:
      'Share your household invite code from the Home tab header. The other person can use it to join via the "Join" option on setup.',
  },
  {
    question: 'Can I be in multiple households?',
    answer:
      'Currently, the app supports one active household per account. You\'d need to leave your current household before joining another.',
  },
  {
    question: 'How are expenses split?',
    answer:
      'Expenses are split equally among the selected members. The person who paid is included in the split automatically.',
  },
  {
    question: 'What happens when I leave a household?',
    answer:
      'You will lose access to all shared expenses and balances in that household. Make sure all debts are settled before leaving.',
  },
];

const SUPPORT_EMAIL = 'support@broketogether.app';

function FAQItem({ item }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      onPress={() => setExpanded(!expanded)}
      className="border-b border-slate-50 p-5"
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-slate-700 font-medium pr-4">
          {item.question}
        </Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#cbd5e1"
        />
      </View>
      {expanded && (
        <Text className="text-slate-500 text-sm mt-3 leading-5">
          {item.answer}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function HelpSupportScreen({ navigation }) {
  const handleEmailPress = async () => {
    try {
      await Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=BrokeTogether Support`);
    } catch {
      Alert.alert('Error', 'Unable to open email client.');
    }
  };

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-primary p-8 pt-16 rounded-b-[40px] shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-white/10 p-2 rounded-full border border-white/20 mr-4"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-black">Help & Support</Text>
        </View>
      </View>

      <View className="p-6 mt-4">
        {/* FAQ Section */}
        <Text className="text-slate-400 font-bold uppercase text-xs mb-4 ml-2">
          Frequently Asked Questions
        </Text>
        <View className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden mb-6">
          {FAQS.map((faq, index) => (
            <FAQItem key={index} item={faq} />
          ))}
        </View>

        {/* Contact Section */}
        <Text className="text-slate-400 font-bold uppercase text-xs mb-4 ml-2">
          Contact Us
        </Text>
        <View className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <TouchableOpacity
            onPress={handleEmailPress}
            className="flex-row items-center p-5"
          >
            <View className="bg-blue-50 p-2.5 rounded-xl mr-4">
              <Ionicons name="mail" size={20} color="#3b82f6" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-700 font-medium">Email Support</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                {SUPPORT_EMAIL}
              </Text>
            </View>
            <Ionicons name="open-outline" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        </View>

        <Text className="text-center text-slate-300 text-xs mt-10 mb-10">
          BrokeTogether v1.0.4
        </Text>
      </View>
    </ScrollView>
  );
}
