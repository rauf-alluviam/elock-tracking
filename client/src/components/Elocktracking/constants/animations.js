// Enhanced CSS for advanced animations and effects
export const advancedAnimations = `
  @keyframes pulse {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes glow {
    0% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
    50% { box-shadow: 0 0 20px rgba(76, 175, 80, 0.8), 0 0 30px rgba(76, 175, 80, 0.6); }
    100% { box-shadow: 0 0 5px rgba(76, 175, 80, 0.5); }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
  }
  
  @keyframes slideIn {
    0% { transform: translateX(-100%); opacity: 0; }
    100% { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes fadeInUp {
    0% { transform: translateY(20px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes heartbeat {
    0% { transform: scale(1); }
    14% { transform: scale(1.1); }
    28% { transform: scale(1); }
    42% { transform: scale(1.1); }
    70% { transform: scale(1); }
  }
  
  @keyframes signal {
    0% { opacity: 1; }
    25% { opacity: 0.3; }
    50% { opacity: 0.7; }
    75% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  
  @keyframes colorShift {
    0% { color: #2196F3; }
    25% { color: #4CAF50; }
    50% { color: #FF9800; }
    75% { color: #9C27B0; }
    100% { color: #2196F3; }
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
    100% { transform: translateY(0px); }
  }
  
  @keyframes ripple {
    0% { transform: scale(0); opacity: 1; }
    100% { transform: scale(4); opacity: 0; }
  }

  @keyframes neonGlow {
    0% { text-shadow: 0 0 5px rgba(0, 255, 255, 0.8); }
    50% { text-shadow: 0 0 20px rgba(0, 255, 255, 1), 0 0 30px rgba(0, 255, 255, 0.8); }
    100% { text-shadow: 0 0 5px rgba(0, 255, 255, 0.8); }
  }

  @keyframes dataFlow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes scanLine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }

  @keyframes breathe {
    0%, 100% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.02); opacity: 1; }
  }
  
  .pulse-animation { animation: pulse 2s infinite; }
  .glow-animation { animation: glow 2s infinite; }
  .bounce-animation { animation: bounce 2s infinite; }
  .spin-animation { animation: spin 2s linear infinite; }
  .shake-animation { animation: shake 0.5s infinite; }
  .slide-in-animation { animation: slideIn 0.5s ease-out; }
  .fade-in-up-animation { animation: fadeInUp 0.5s ease-out; }
  .heartbeat-animation { animation: heartbeat 1.5s infinite; }
  .signal-animation { animation: signal 2s infinite; }
  .color-shift-animation { animation: colorShift 3s infinite; }
  .float-animation { animation: float 3s ease-in-out infinite; }
  .ripple-animation { animation: ripple 0.6s linear; }
  .neon-glow-animation { animation: neonGlow 2s infinite; }
  .data-flow-animation { 
    background: linear-gradient(90deg, transparent, rgba(33, 150, 243, 0.3), transparent);
    background-size: 200% 100%;
    animation: dataFlow 2s infinite;
  }
  .scan-line-animation { animation: scanLine 2s infinite; }
  .breathe-animation { animation: breathe 3s infinite; }

  /* Advanced hover effects */
  .advanced-card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }
  
  .advanced-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  }
  
  .advanced-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
  }
  
  .advanced-card:hover::before {
    left: 100%;
  }

  /* Real-time status indicators */
  .status-online {
    background: radial-gradient(circle, rgba(76, 175, 80, 0.3) 0%, transparent 70%);
    animation: pulse 2s infinite;
  }
  
  .status-offline {
    background: radial-gradient(circle, rgba(244, 67, 54, 0.3) 0%, transparent 70%);
    animation: heartbeat 2s infinite;
  }

  /* Interactive elements */
  .interactive-icon {
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .interactive-icon:hover {
    transform: scale(1.2) rotate(15deg);
    filter: drop-shadow(0 0 8px rgba(33, 150, 243, 0.8));
  }
`;
