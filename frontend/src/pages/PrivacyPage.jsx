import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const PrivacyPage = () => (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <Shield className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white">Política de Privacidade</h1>
                <p className="text-xs text-slate-500 mt-1">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
        </div>

        <div className="glass rounded-2xl p-8 space-y-8 text-sm text-slate-300 leading-relaxed">
            <section>
                <h2 className="text-lg font-bold text-white mb-3">1. Informações que Coletamos</h2>
                <ul className="list-disc list-inside space-y-2 text-slate-400">
                    <li><b className="text-slate-300">Dados de Conta:</b> Nome, email e foto de perfil (via Google ou cadastro manual).</li>
                    <li><b className="text-slate-300">Dados de Uso:</b> Gerações realizadas, configurações utilizadas, tempo de uso.</li>
                    <li><b className="text-slate-300">Dados Técnicos:</b> IP, tipo de navegador, sistema operacional (via Google Analytics).</li>
                    <li><b className="text-slate-300">Imagens Enviadas:</b> Processadas para geração 3D e não armazenadas permanentemente.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">2. Como Usamos suas Informações</h2>
                <ul className="list-disc list-inside space-y-2 text-slate-400">
                    <li>Fornecer e melhorar o Serviço de geração 3D.</li>
                    <li>Manter sua conta e histórico de gerações.</li>
                    <li>Exibir anúncios relevantes (Google AdSense).</li>
                    <li>Analisar uso do Serviço para melhorias (Google Analytics).</li>
                    <li>Comunicar atualizações e novidades do Serviço.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">3. Cookies e Tecnologias Similares</h2>
                <p>Utilizamos cookies para:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-400 mt-2">
                    <li><b className="text-slate-300">Essenciais:</b> Autenticação e preferências do usuário.</li>
                    <li><b className="text-slate-300">Análise:</b> Google Analytics para entender padrões de uso.</li>
                    <li><b className="text-slate-300">Publicidade:</b> Google AdSense para exibição de anúncios personalizados.</li>
                </ul>
                <p className="mt-2">Você pode controlar cookies através do banner de consentimento ou configurações do navegador.</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">4. Compartilhamento de Dados</h2>
                <p>Não vendemos seus dados pessoais. Compartilhamos apenas com:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-400 mt-2">
                    <li><b className="text-slate-300">Firebase (Google):</b> Infraestrutura de autenticação e banco de dados.</li>
                    <li><b className="text-slate-300">Google Analytics:</b> Análise de uso agregada.</li>
                    <li><b className="text-slate-300">Google AdSense:</b> Exibição de anúncios.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">5. Seus Direitos (LGPD)</h2>
                <p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-400 mt-2">
                    <li>Acessar seus dados pessoais.</li>
                    <li>Corrigir dados incompletos ou desatualizados.</li>
                    <li>Solicitar a exclusão dos seus dados.</li>
                    <li>Revogar o consentimento para uso de cookies.</li>
                    <li>Solicitar portabilidade dos seus dados.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">6. Segurança</h2>
                <p>Implementamos medidas técnicas para proteger seus dados, incluindo criptografia em trânsito (HTTPS), autenticação segura (Firebase Auth) e armazenamento protegido.</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">7. Retenção de Dados</h2>
                <p>Mantemos seus dados enquanto sua conta estiver ativa. Imagens enviadas para geração são processadas e não armazenadas permanentemente no servidor.</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">8. Contato</h2>
                <p>Para exercer seus direitos ou esclarecer dúvidas: <span className="text-cyan-400">privacidade@nexa3dgen.com</span></p>
            </section>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
            Veja também nossos <Link to="/terms" className="text-cyan-400 hover:text-cyan-300">Termos de Uso</Link>
        </p>
    </div>
);

export default PrivacyPage;
