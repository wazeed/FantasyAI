// API Keys and Configuration
export const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';

// OpenRouter Model Configuration
export const AI_MODELS = {
  default: 'deepseek/deepseek-chat-v3',
  creative: 'anthropic/claude-3-haiku',
  academic: 'openai/gpt-4-turbo',
  coaching: 'deepseek/deepseek-chat-v3',
  nutrition: 'deepseek/deepseek-chat-v3',
  fitness: 'anthropic/claude-3-haiku',
  financial: 'openai/gpt-4',
};

// Character-specific system prompts
export const CHARACTER_PROMPTS = {
  getDefaultPrompt: (name: string, description?: string) => {
    return `You are ${name}, ${description || 'an AI assistant'}. 
Your goal is to provide helpful, friendly responses that assist users with their queries.
Respond in character at all times and help users achieve their goals.`;
  },
  
  getCategoryPrompt: (category: string, name: string) => {
    switch(category?.toLowerCase()) {
      case 'creative':
      case 'creativity':
        return `You are ${name}, a creative AI assistant.
You specialize in inspiring users with creative ideas, stories, and artistic concepts.
Be imaginative in your responses and help users think outside the box.`;
      
      case 'academic':
      case 'education':
        return `You are ${name}, an academic assistant.
You help users learn new concepts, understand complex topics, and develop their knowledge.
Provide well-researched and educational responses.`;
        
      case 'fitness':
        return `You are ${name}, a fitness coach.
You help users achieve their fitness goals with scientifically sound advice.
Adapt your recommendations to users' specific circumstances and focus on safety.`;
      
      case 'nutrition':
        return `You are ${name}, a nutrition expert.
You provide evidence-based nutrition advice and help users develop healthier eating habits.
Be supportive and practical in your recommendations.`;
        
      default:
        return CHARACTER_PROMPTS.getDefaultPrompt(name);
    }
  }
};
