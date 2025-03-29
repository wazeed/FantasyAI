import { NavigationProp, RouteProp } from '@react-navigation/native';
import { RootStackParamList, MainTabsParamList } from './navigation';

export interface BaseScreenProps<T extends keyof RootStackParamList> {
  navigation: NavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
}

export interface BaseTabScreenProps<T extends keyof MainTabsParamList> {
  navigation: NavigationProp<MainTabsParamList, T>;
  route: RouteProp<MainTabsParamList, T>;
}

export type ContactUsScreenProps = BaseScreenProps<'ContactUs'>;
export type FAQsScreenProps = BaseScreenProps<'FAQs'>;
export type HealthCenterScreenProps = BaseScreenProps<'HealthCenter'>;
export type HelpCenterScreenProps = BaseScreenProps<'HelpCenter'>;
export type NotificationSettingsScreenProps = BaseScreenProps<'NotificationSettings'>;
export type PrivacySettingsScreenProps = BaseScreenProps<'PrivacySettings'>;
export type SecuritySettingsScreenProps = BaseScreenProps<'SecuritySettings'>;
export type ReportProblemScreenProps = BaseScreenProps<'ReportProblem'>;
export type LoginScreenProps = BaseScreenProps<'EmailSignIn'>;

export type HomeTabScreenProps = BaseTabScreenProps<'HomeTab'>;
export type ProfileTabScreenProps = BaseTabScreenProps<'ProfileTab'>;
export type SettingsTabScreenProps = BaseTabScreenProps<'SettingsTab'>;