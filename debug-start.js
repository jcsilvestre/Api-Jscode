const { spawn } = require('child_process');

console.log('🚀 INICIANDO DEBUG DA APLICAÇÃO...');
console.log('📊 VARIÁVEIS DE AMBIENTE:');
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   PORT:', process.env.PORT);
console.log('   HOST:', process.env.HOST);
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'DEFINIDA' : 'NÃO DEFINIDA');

const child = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'development',
    PORT: '3000',
    HOST: '0.0.0.0'
  }
});

child.on('error', (error) => {
  console.error('❌ ERRO AO INICIAR PROCESSO:', error);
});

child.on('exit', (code, signal) => {
  console.log('🔚 PROCESSO FINALIZADO:', { code, signal });
});

process.on('SIGTERM', () => {
  console.log('📡 RECEBIDO SIGTERM, FINALIZANDO...');
  child.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📡 RECEBIDO SIGINT, FINALIZANDO...');
  child.kill('SIGINT');
});