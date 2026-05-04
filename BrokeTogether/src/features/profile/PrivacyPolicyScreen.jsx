import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LAST_UPDATED = 'May 4, 2026';
const CONTACT_EMAIL = 'support.broketogether@gmail.com';

function Section({ title, children }) {
  return (
    <View className="mb-6">
      <Text className="text-slate-800 font-bold text-base mb-2">{title}</Text>
      <Text className="text-slate-500 text-sm leading-6">{children}</Text>
    </View>
  );
}

export default function PrivacyPolicyScreen({ navigation }) {
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
          <Text className="text-white text-2xl font-black">Privacy Policy</Text>
        </View>
      </View>

      <View className="p-6 mt-4">
        <View className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 mb-6">
          <Text className="text-slate-400 text-xs mb-4">Last updated: {LAST_UPDATED}</Text>

          <Section title="1. Introduction">
            BrokeTogether ("we," "our," or "the App") is a mobile application designed to help
            roommates and housemates track shared expenses and settle debts. This Privacy Policy
            explains how we collect, use, store, and protect your personal information when you
            use our App. By creating an account or using BrokeTogether, you agree to the
            practices described in this policy.
          </Section>

          <Section title="2. Information We Collect">
            {`We collect the following information when you use BrokeTogether:

Account Information: Your full name, email address, and password (stored securely in hashed form on our servers).

Household Data: Household names you create or join, invite codes, and your membership status within households.

Financial Data: Expense descriptions, amounts, categories, split allocations, settlement records, and balance information that you voluntarily enter into the App.

Device & Usage Data: We may collect basic device information (operating system, app version) for the purpose of troubleshooting and improving app performance. We do not collect location data, contacts, or device identifiers for advertising purposes.

Authentication Tokens: Secure session tokens are stored locally on your device using platform-native encrypted storage (iOS Keychain / Android EncryptedSharedPreferences) to keep you signed in.`}
          </Section>

          <Section title="3. How We Use Your Information">
            {`We use your information solely to:

- Provide, operate, and maintain the App's core functionality (expense tracking, splitting, and settlement).
- Authenticate your identity and secure your account.
- Display household membership and balance information to you and your household members.
- Communicate with you regarding account-related matters (e.g., support requests).

We do NOT use your information for advertising, profiling, or selling to third parties.`}
          </Section>

          <Section title="4. Information Shared with Household Members">
            When you join a household, other members of that household can see your name, the
            expenses you create, and the balance information between you and other members. This
            sharing is essential to the App's core functionality. Do not join a household unless
            you are comfortable sharing this financial information with its members.
          </Section>

          <Section title="5. Data Storage & Security">
            {`Your data is transmitted over HTTPS (TLS encryption) and stored on secure servers. Passwords are hashed and never stored in plaintext. Authentication tokens are stored using platform-native encrypted storage on your device.

While we take reasonable measures to protect your data, no method of electronic storage or transmission is 100% secure. We cannot guarantee absolute security of your information.`}
          </Section>

          <Section title="6. Data Retention & Deletion">
            {`We retain your account and financial data for as long as your account is active.

You may permanently delete your account at any time directly from the app by going to Profile → Delete Account. Upon confirming deletion, all of your personal data will be immediately and permanently removed from our systems, including your profile information, household memberships, and expense history.

If you are the admin of a household, deleting your account will also permanently delete that household and all of its associated expenses and data for all members.

If you are a member (not admin) of a household, deleting your account will remove you from that household. The household and its expense history will remain intact for the other members.

When you leave a household, your access to that household's data is removed. Settlement and expense records involving you may be retained in the household's history for the other members' records.

Some data may persist in encrypted backups for up to 90 days before being permanently purged. If you prefer to request deletion via email, you may also contact us at ${CONTACT_EMAIL}.`}
          </Section>

          <Section title="7. Third-Party Services">
            BrokeTogether uses the following third-party services to operate:
            {`\n\n- Cloud Hosting: Our backend is hosted on Railway (railway.app). Your data is processed and stored on their infrastructure subject to their security practices.
- Expo: We use the Expo framework for app delivery. Expo may collect basic crash and performance data.

We do not integrate with any advertising networks, analytics platforms, or social media tracking services.`}
          </Section>

          <Section title="8. Children's Privacy">
            BrokeTogether is not intended for use by anyone under the age of 13. We do not
            knowingly collect personal information from children under 13. If we learn that we have
            collected information from a child under 13, we will delete that information promptly.
          </Section>

          <Section title="9. Your Rights">
            {`Depending on your jurisdiction, you may have the right to:

- Access the personal data we hold about you.
- Request correction of inaccurate data.
- Request deletion of your data.
- Withdraw consent for data processing.
- Export your data in a portable format.

To exercise any of these rights, contact us at ${CONTACT_EMAIL}. We will respond within 30 days.`}
          </Section>

          <Section title="10. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify you of material
            changes through the App or via email. Your continued use of the App after changes
            are posted constitutes acceptance of the updated policy.
          </Section>

          <Section title="11. Contact Us">
            {`If you have any questions or concerns about this Privacy Policy, please contact us at:

${CONTACT_EMAIL}`}
          </Section>
        </View>

        <Text className="text-center text-slate-300 text-xs mb-10">
          BrokeTogether v1.0.4
        </Text>
      </View>
    </ScrollView>
  );
}
