import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LAST_UPDATED = 'May 4, 2026';
const CONTACT_EMAIL = 'support.broketogether@gmail.com';

function Section({ title, children }) {
  return (
    <View className="mb-6">
      <Text className="text-slate-800 dark:text-slate-100 font-bold text-base mb-2">{title}</Text>
      <Text className="text-slate-500 dark:text-slate-400 text-sm leading-6">{children}</Text>
    </View>
  );
}

export default function TermsConditionsScreen({ navigation }) {
  return (
    <ScrollView className="flex-1 bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <View className="bg-primary p-8 pt-16 rounded-b-[40px] shadow-lg">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-white/10 p-2 rounded-full border border-white/20 mr-4"
          >
            <Ionicons name="arrow-back" size={22} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-2xl font-black">Terms & Conditions</Text>
        </View>
      </View>

      <View className="p-6 mt-4">
        <View className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 mb-6">
          <Text className="text-slate-400 dark:text-slate-500 text-xs mb-4">Last updated: {LAST_UPDATED}</Text>

          <Section title="1. Acceptance of Terms">
            By downloading, installing, or using BrokeTogether ("the App"), you agree to be
            bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms,
            do not use the App. We reserve the right to update these Terms at any time; continued
            use of the App after changes constitutes acceptance.
          </Section>

          <Section title="2. Description of Service">
            BrokeTogether is an expense-tracking and bill-splitting tool designed for roommates
            and housemates. The App allows users to create households, record shared expenses,
            calculate balances, and track settlements among household members. The App is a
            record-keeping tool only and does not process, hold, or transfer any actual money.
          </Section>

          <Section title="3. Eligibility">
            You must be at least 13 years old to create an account and use BrokeTogether. By
            using the App, you represent and warrant that you meet this age requirement and have
            the legal capacity to enter into these Terms.
          </Section>

          <Section title="4. Account Responsibilities">
            {`You are responsible for:

- Providing accurate and truthful information during registration.
- Maintaining the confidentiality of your account credentials.
- All activity that occurs under your account.
- Notifying us immediately if you suspect unauthorized access to your account.

We reserve the right to suspend or terminate accounts that violate these Terms or are used for fraudulent purposes.`}
          </Section>

          <Section title="5. Acceptable Use">
            {`You agree NOT to use BrokeTogether to:

- Enter false, misleading, or fraudulent expense information.
- Harass, abuse, or intimidate other household members.
- Attempt to gain unauthorized access to other users' accounts or data.
- Reverse-engineer, decompile, or attempt to extract the source code of the App.
- Use the App for any illegal purpose or in violation of any applicable laws.
- Circumvent or interfere with security features of the App.
- Use automated scripts, bots, or scrapers to interact with the App.`}
          </Section>

          <Section title="6. Financial Disclaimer">
            {`BROKETOGETHER IS NOT A FINANCIAL SERVICE, PAYMENT PROCESSOR, OR MONEY TRANSFER SERVICE. The App is solely a record-keeping tool for tracking shared expenses among household members.

- The App does not process, hold, facilitate, or guarantee any financial transactions or payments between users.
- All actual payments and settlements between users occur outside the App and are entirely between the involved parties.
- Recording a settlement in the App does not constitute proof of payment or a legally binding financial transaction.
- We are not responsible for any disputes, losses, or damages arising from financial arrangements between users.
- Expense calculations and balance amounts displayed in the App are based on user-entered data and may contain errors. Users are responsible for verifying accuracy.
- We do not provide financial, tax, or legal advice. Consult a qualified professional for such matters.`}
          </Section>

          <Section title="7. Household Data & Shared Information">
            {`When you create or join a household:

- Your name and expense activity will be visible to all members of that household.
- Any member can add expenses that affect your balance.
- The household creator may have the ability to remove members.
- Leaving a household does not retroactively remove your data from that household's expense history.

You are responsible for only joining households with people you trust. We are not liable for disputes arising from shared household data.`}
          </Section>

          <Section title="8. Limitation of Liability">
            {`TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:

- BrokeTogether and its developers, officers, and affiliates shall NOT be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the App.
- We shall NOT be liable for any financial losses, disputes, or damages arising from expense tracking, balance calculations, or settlement records in the App.
- We shall NOT be liable for any loss of data, unauthorized access, or service interruptions.
- Our total cumulative liability to you for all claims arising from or related to the App shall not exceed the amount you paid us in the twelve (12) months preceding the claim (which, for free users, is zero).

The App is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, accuracy, or non-infringement.`}
          </Section>

          <Section title="9. Indemnification">
            You agree to indemnify, defend, and hold harmless BrokeTogether, its developers,
            officers, and affiliates from any claims, damages, losses, liabilities, costs, and
            expenses (including reasonable attorney's fees) arising from your use of the App,
            your violation of these Terms, your violation of any rights of a third party, or any
            dispute between you and another user regarding shared expenses or settlements.
          </Section>

          <Section title="10. Dispute Resolution">
            {`Any disputes arising from these Terms or your use of the App shall first be attempted to be resolved through good-faith negotiation by contacting us at ${CONTACT_EMAIL}.

If a dispute cannot be resolved informally within 30 days, it shall be resolved through binding arbitration in accordance with the rules of the jurisdiction where the App operator is located, rather than in court. You waive any right to participate in a class action lawsuit or class arbitration against BrokeTogether.

Nothing in this section prevents either party from seeking injunctive or equitable relief in court for matters related to intellectual property or unauthorized access.`}
          </Section>

          <Section title="11. Intellectual Property">
            All content, features, and functionality of the App (including but not limited to
            text, graphics, logos, icons, and software) are the property of BrokeTogether and are
            protected by intellectual property laws. You may not reproduce, distribute, modify,
            or create derivative works from any part of the App without prior written consent.
          </Section>

          <Section title="12. Termination & Account Deletion">
            {`We may suspend or terminate your access to the App at any time, with or without cause, and with or without notice. Upon termination:

- Your right to use the App ceases immediately.
- We may delete your account and associated data in accordance with our Privacy Policy.
- Sections regarding Limitation of Liability, Indemnification, and Dispute Resolution shall survive termination.

You may also delete your own account at any time by going to Profile → Delete Account within the App. By choosing to delete your account you acknowledge and agree that:

- All your personal data, expense history, and household memberships will be permanently and irreversibly deleted.
- If you are the admin of a household, that household and all of its data will be permanently deleted and all members will immediately lose access.
- If you are a member (not admin) of a household, you will be removed from the household but the household and its data will remain for other members.
- This action cannot be undone and we are unable to recover any deleted data.`}
          </Section>

          <Section title="13. Severability">
            If any provision of these Terms is found to be unenforceable or invalid by a court
            of competent jurisdiction, that provision shall be limited or eliminated to the
            minimum extent necessary, and the remaining provisions shall remain in full force
            and effect.
          </Section>

          <Section title="14. Entire Agreement">
            These Terms, together with our Privacy Policy, constitute the entire agreement
            between you and BrokeTogether regarding your use of the App and supersede any prior
            agreements or understandings.
          </Section>

          <Section title="15. Contact Us">
            {`If you have any questions about these Terms and Conditions, please contact us at:

${CONTACT_EMAIL}`}
          </Section>
        </View>

        <Text className="text-center text-slate-300 dark:text-slate-600 text-xs mb-10">
          BrokeTogether v1.0.4
        </Text>
      </View>
    </ScrollView>
  );
}
