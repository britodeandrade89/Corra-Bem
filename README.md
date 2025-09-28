# AB Fit Outdoor - Web App de Assessoria

Este é um web app completo para a assessoria esportiva AB Fit Outdoor, projetado para funcionar diretamente no navegador de celulares. Ele permite que alunos acessem seus treinos, registrem atividades e monitorem o sono.

## Funcionalidades

- **Login de Alunos:** Seleção de perfil a partir de uma lista de alunos.
- **Visualização de Treinos:** Acesso a treinos de força (A e B) e treinos de corrida.
- **Calendário de Check-in:** Os alunos podem marcar os treinos realizados, e o registro aparece em um calendário mensal.
- **AB Fit Outdoor:** Módulo de rastreamento por GPS para atividades ao ar livre como corrida, caminhada e ciclismo.
  - Exibe o mapa com a localização atual.
  - Monitora em tempo real: distância, tempo, velocidade e ritmo.
  - Salva um histórico de treinos outdoor.
- **Monitor de Sono:** Uma prova de conceito que utiliza o microfone e o acelerômetro do celular para detectar ruídos e movimentos, simulando um monitoramento de sono.
  - Salva um histórico de sessões de sono.
- **Persistência de Dados:** Todos os dados (check-ins, treinos outdoor, registros de sono) são salvos no `localStorage` do navegador, mantendo as informações do usuário entre as sessões.

## Estrutura dos Arquivos

- `index.html`: A estrutura principal do aplicativo.
- `style.css`: Contém todos os estilos visuais da aplicação.
- `script.js`: Toda a lógica funcional, manipulação de dados e interatividade.
- `database.json`: O arquivo de dados inicial para novos usuários. Na primeira execução, o `script.js` carrega estes dados e depois os gerencia via `localStorage`.
- `README.md`: Este arquivo.

## Como Executar

1.  **Crie os 4 arquivos** (`index.html`, `style.css`, `script.js`, `database.json`) na mesma pasta.
2.  **Use um Servidor Local:** Devido às políticas de segurança dos navegadores, a funcionalidade de GPS (`navigator.geolocation`) e a leitura de arquivos locais (`fetch('database.json')`) não funcionam ao abrir o `index.html` diretamente. É necessário servi-lo a partir de um servidor local.
    - Se você usa o **Visual Studio Code**, instale a extensão [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer).
    - Com a extensão instalada, clique com o botão direito no arquivo `index.html` e selecione "Open with Live Server".
3.  Abra o endereço fornecido pelo Live Server (geralmente `http://127.0.0.1:5500`) no seu navegador.

## Tecnologias Utilizadas

- **HTML5**
- **CSS3** (com Tailwind CSS para utilitários)
- **JavaScript (ES6+)**
- **Leaflet.js:** Biblioteca para os mapas interativos.
- **Feather Icons & Font Awesome:** Para os ícones.
- **Web APIs:** Geolocation, Web Audio, Device Motion.
