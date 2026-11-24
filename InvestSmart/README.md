# InvestSmart — pacote integrado

## Estrutura principal
- `projeto/index.html`: site público.
- `projeto/Cadastro/Cadastro.html`: cadastro.
- `projeto/Login/Login.html`: login.
- `projeto/Admin/adm.php`: painel administrativo.
- `conexao.php`, `iniciar.php`, `sessao.php`, `salvar_simulacao.php`, `anotacoes.php`, `sair.php`: backend/API na pasta principal.
- `tabelas.php`: cria a tabela de anotações e completa colunas auxiliares sem apagar dados.

## Instalação local (XAMPP)
1. Faça backup da pasta antiga.
2. Extraia a pasta `PROJETO` deste pacote para `C:\xampp\htdocs\PROJETO`.
3. No XAMPP, inicie Apache e MySQL/MariaDB.
4. Confirme que o banco `investsmart` existe no phpMyAdmin e contém `usuarios` e `simulacoes`.
5. A tabela `usuarios` precisa ter a coluna `tipo` com `ENUM('usuario','admin')` e padrão `usuario`. Se ela já aparece no phpMyAdmin, não execute ALTER TABLE de novo.
6. Confira em `conexao.php` o host, nome do banco, usuário e senha do seu MariaDB. O padrão deste pacote é `localhost`, banco `investsmart`, usuário `root`, senha vazia.
7. Abra `http://localhost/PROJETO/teste.php`. Resolva qualquer item com ❌ antes de apresentar.
8. Abra `http://localhost/PROJETO/projeto/index.html`.

## Conta administradora
A conta que deve abrir o painel precisa existir na tabela `usuarios` e ter `tipo = 'admin'`.
Para promover uma conta já cadastrada, execute no phpMyAdmin (substitua pelo e-mail correto):

```sql
UPDATE usuarios SET tipo = 'admin' WHERE email = 'SEU_EMAIL';
```

O cadastro normal cria contas como `usuario`. O login consulta a coluna `tipo`: admin vai para `projeto/Admin/adm.php`; usuário comum vai para `projeto/index.html`.

## Testes manuais antes da apresentação
1. Cadastro: crie um usuário de teste e confirme que aparece em `usuarios` com `tipo = usuario`.
2. Login comum: entre com esse usuário e confirme que volta ao site.
3. Simulador: faça uma simulação logado e confira uma nova linha em `simulacoes`.
4. Anotações: salve uma anotação vinculada à simulação e confira em `anotacoes`.
5. Administrador: entre com a conta `tipo = admin` e confira o painel.
6. No painel, confira visão geral, usuários, simulações e administradores.
7. Tente abrir `http://localhost/PROJETO/projeto/Admin/adm.php` em janela anônima: deve redirecionar ao login.

## Limite importante
Os arquivos PHP foram verificados com `php -l` (sintaxe). O funcionamento final depende da configuração local do XAMPP/MariaDB e do esquema real do banco. Por isso, execute `teste.php` e os testes manuais acima neste computador antes de considerar a apresentação validada.
