import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  Login: undefined;
  EmailSignIn: { isSignUp?: boolean };
  MainTabs: undefined;
  Onboarding: undefined;
  Chat: { 
    character: {
      id: number | string;
      name: string;
      description?: string; 
      avatar: any;
      tags?: string[];
      category?: string;
      openingMessage?: string;
      exampleQuestions?: string[];
      suggestedQuestions?: string[];
      greeting?: string;
      image_url?: string;
      model?: string;
      system_prompt?: string;
    }
  };
  EditProfile: undefined;
  Settings: undefined;
  PrivacySettings: undefined;
  NotificationSettings: undefined;
  SecuritySettings: undefined;
  FAQs: undefined;
  ReportProblem: undefined;
  HelpCenter: undefined;
  ContactUs: undefined;
  SubscriptionScreen: { isSpecialOffer?: boolean; returnToCharacter?: any };
  SubscriptionOfferScreen: undefined;
  DiscountOfferScreen: { fromCharacter?: boolean };
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
};

export type MainTabsParamList = {
  HomeTab: undefined;
  ChatTab: undefined;
  ProfileTab: undefined;
};

export type RootStackNavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type MainTabsNavigationProp = BottomTabNavigationProp<MainTabsParamList>;

export type BaseTabScreenProps<T extends keyof MainTabsParamList> = {
  navigation: MainTabsNavigationProp;
  route: {
    key: string;
    name: T;
    params: MainTabsParamList[T];
  };
};