import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, FileText, AlertTriangle } from 'lucide-react';

const TermsPage = () => (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-cyan-500/10 p-2.5 rounded-xl border border-cyan-500/20">
                <FileText className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
                <h1 className="text-2xl font-bold text-white">Termos de Uso</h1>
                <p className="text-xs text-slate-500 mt-1">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>
            </div>
        </div>

        <div className="glass rounded-2xl p-8 space-y-8 text-sm text-slate-300 leading-relaxed">
            <section>
                <h2 className="text-lg font-bold text-white mb-3">1. Aceitação dos Termos</h2>
                <p>Ao acessar e usar o Nexa 3D Gen ("Serviço"), você concorda com estes Termos de Uso. Se não concordar, não use o Serviço.</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">2. Descrição do Serviço</h2>
                <p>O Nexa 3D Gen é uma plataforma de geração de modelos 3D utilizando inteligência artificial. O Serviço permite que usuários façam upload de imagens ou forneçam descrições textuais para gerar modelos tridimensionais em diversos formatos (GLB, STL, OBJ).</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">3. Conta do Usuário</h2>
                <ul className="list-disc list-inside space-y-2 text-slate-400">
                    <li>Você deve criar uma conta para utilizar os recursos de geração.</li>
                    <li>Você é responsável por manter a segurança da sua conta.</li>
                    <li>Informações fornecidas devem ser precisas e atualizadas.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">4. Uso Aceitável</h2>
                <p className="mb-2">Você concorda em NÃO usar o Serviço para:</p>
                <ul className="list-disc list-inside space-y-2 text-slate-400">
                    <li>Gerar conteúdo ilegal, ofensivo ou que viole direitos de terceiros.</li>
                    <li>Fazer upload de imagens que contenham nudez, violência ou conteúdo inadequado.</li>
                    <li>Tentar sobrecarregar ou interferir na infraestrutura do Serviço.</li>
                    <li>Revender ou redistribuir o Serviço sem autorização.</li>
                </ul>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">5. Propriedade Intelectual</h2>
                <p>Os modelos 3D gerados pelo Serviço são de propriedade do usuário que os criou, sujeitos às limitações da tecnologia de IA utilizada (Hunyuan3D-2, Tencent). O Nexa 3D Gen não reivindica propriedade sobre os modelos gerados.</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">6. Limitação de Responsabilidade</h2>
                <p>O Serviço é fornecido "como está". Não garantimos disponibilidade ininterrupta, qualidade específica dos modelos gerados ou adequação a qualquer finalidade particular.</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">7. Anúncios</h2>
                <p>O Serviço pode exibir anúncios de terceiros. Ao usar o Serviço, você reconhece e aceita a exibição de anúncios como forma de viabilizar a plataforma.</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">8. Modificações</h2>
                <p>Reservamo-nos o direito de modificar estes Termos a qualquer momento. Alterações significativas serão comunicadas por meio do Serviço.</p>
            </section>

            <section>
                <h2 className="text-lg font-bold text-white mb-3">9. Contato</h2>
                <p>Para dúvidas sobre estes Termos, entre em contato pelo email: <span className="text-cyan-400">contato@nexa3dgen.com</span></p>
            </section>
        </div>

        <p className="text-center text-xs text-slate-600 mt-8">
            Veja também nossa <Link to="/privacy" className="text-cyan-400 hover:text-cyan-300">Política de Privacidade</Link>
        </p>
    </div>
);

export default TermsPage;
