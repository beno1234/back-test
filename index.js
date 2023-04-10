const express = require("express");
const app = express();
const router = express.Router();
const mysql = require("mysql");
const cors = require("cors");
const { addMonths, lastDayOfMonth, format } = require("date-fns");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;
require("dotenv").config();
const bodyParser = require("body-parser");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Ae@1254453",
  database: "dogz",
});

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post("/register", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM user WHERE email = ?", [email], (err, result) => {
    if (err) {
      res.send(err);
    }
    if (result.length == 0) {
      bcrypt.hash(password, saltRounds, (err, hash) => {
        db.query(
          "INSERT INTO user (email, password) VALUE (?,?)",
          [email, hash],
          (error, response) => {
            if (err) {
              res.send(err);
            }

            res.send({ msg: "Usuário cadastrado com sucesso" });
          }
        );
      });
    } else {
      res.send({ msg: "Email já cadastrado" });
    }
  });
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.query("SELECT * FROM user WHERE email = ?", [email], (err, result) => {
    if (err) {
      res.send(err);
    }
    if (result.length > 0) {
      bcrypt.compare(password, result[0].password, (error, response) => {
        if (error) {
          res.send(error);
        }
        if (response) {
          // Gerando o token JWT
          const token = jwt.sign({ email: email }, "secretkey", {
            expiresIn: "1h",
          });
          res.json({ token });
        } else {
          res.send({ msg: "Senha incorreta" });
        }
      });
    } else {
      res.send({ msg: "Usuário não registrado!" });
    }
  });
});

app.get("/list-users", async (req, res) => {
  try {
    db.query("SELECT * FROM user", (err, results, fields) => {
      if (err) {
        return res.status(500).json({ message: err });
      }
      console.log(results);
      if (results.length > 0) {
        return res.status(200).json(results);
      } else {
        return res.status(401).json({ message: err });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

app.post("/tutor", (req, res) => {
  const {
    nome,
    cpf,
    email,
    instagram,
    emergency,
    endereco,
    complemento,
    cidade,
    cep,
    contact,
    pets,
  } = req.body;

  db.query(
    "INSERT INTO tutor (nome, cpf, email, instagram, emergency, endereco, complemento, cidade, cep, contact) VALUES (?,?,?,?,?,?,?,?,?,?)",
    [
      nome,
      cpf,
      email,
      instagram,
      emergency,
      endereco,
      complemento,
      cidade,
      cep,
      contact,
    ],
    (err, result) => {
      if (err) {
        res.send(err);
      }
      const id_tutor = result.insertId;
      pets.forEach((pet) => {
        db.query(
          "INSERT INTO pets (nomePets, apelido, raca, cor, nascimento, id_tutor) VALUES (?,?,?,?,?,?)",
          [
            pet.nomePets,
            pet.apelido,
            pet.raca,
            pet.cor,
            pet.nascimento,
            id_tutor,
          ],
          (error, response) => {
            if (error) {
              res.send(error);
            }
          }
        );
      });
      db.query(
        "UPDATE tutor SET status = false WHERE id = ?",
        [id_tutor],
        (error, response) => {
          if (error) {
            res.send(error);
          }
          res.send({ msg: "Tutor e pets cadastrados com sucesso" });
        }
      );
    }
  );
});

app.get("/tutor", (req, res) => {
  db.query("SELECT * FROM tutor", (err, result) => {
    if (err) {
      res.send(err);
    }

    res.send(result);
  });
});

/* app.post("/planos-tutor", (req, res) => {
  const { valor, list, id_tutor } = req.body;
  list.map(({ recorrencia, servicos, vezes_recorrencia }) => {
    console.log(recorrencia, servicos, vezes_recorrencia);
    db.query(
      "INSERT INTO planos (valor, recorrencia, servicos, vezes_recorrencia, id_tutor) VALUES (?, ?, ?, ?, ?)",
      [valor, recorrencia, servicos, vezes_recorrencia, id_tutor],
      (err, result) => {
        if (err) {
          res.send(err);
        }
      }
    );
  });
  res.send("Plano criado com sucesso!");
}); */

/* app.post("/planos-tutor", (req, res) => {
  const { valor, list, id_tutor } = req.body;
  let totalValor = 0; // inicializa a variável com zero

  list.forEach(({ recorrencia, vezes_recorrencia, servicos }) => {
    console.log(recorrencia, servicos, vezes_recorrencia);
    db.query(
      "INSERT INTO planos (valor, recorrencia, servicos, vezes_recorrencia, id_tutor) VALUES (?, ?, ?, ?, ?)",
      [valor, recorrencia, servicos, vezes_recorrencia, id_tutor],
      (err, result) => {
        if (err) {
          return res.status(500).send(err);
        }

        const plano_id = result.insertId;
        const tutor_plano_values = list.map(() => [id_tutor, plano_id]);
        db.query(
          "INSERT INTO tutor_planos (id_tutor, id_plano, valor_total) VALUES (?, ?, ?)",
          [id_tutor, result.insertId, totalValor], // insere o valor total na tabela tutor_planos,
          (err) => {
            if (err) {
              return res.status(500).send(err);
            } else {
              totalValor += valor; // adiciona o valor do plano na variável totalValor
            }
          }
        );
      }
    );
  });

  res.send("Planos criados com sucesso!");
}); */

/* app.post("/planos-tutor", (req, res) => {
  const { valor, list, id_tutor } = req.body;
  let totalValor = 0;

  list.forEach(({ recorrencia, vezes_recorrencia, servicos }) => {
    db.query(
      "INSERT INTO planos (valor, recorrencia, servicos, vezes_recorrencia, id_tutor) VALUES (?, ?, ?, ?, ?)",
      [valor, recorrencia, servicos, vezes_recorrencia, id_tutor],
      (err, result) => {
        if (err) {
          return res.status(500).send(err);
        }

        const plano_id = result.insertId;
        const tutor_plano_values = list.map(() => [id_tutor, plano_id]);
        db.query(
          "INSERT INTO tutor_planos (id_tutor, id_plano, valor_total) VALUES (?, ?, ?)",
          [id_tutor, result.insertId, totalValor],
          (err) => {
            if (err) {
              return res.status(500).send(err);
            } else {
              totalValor += valor;
              if (totalValor === valor * list.length) {
                res.send("Planos criados com sucesso!");
              }
            }
          }
        );
      }
    );
  });
}); */

app.post("/planos-tutor", (req, res) => {
  const { valor, list, id_tutor, data } = req.body; // Adicionando o parâmetro "data" na requisição HTTP
  let totalValor = 0;

  list.forEach(({ recorrencia, vezes_recorrencia, servicos }) => {
    const currentDate = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const dayOfMonth = new Date().getDate();
    const data_fim = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth(),
      dayOfMonth
    )
      .toISOString()
      .slice(0, 10);

    const data_insercao = data || currentDate; // Definindo a data de inserção com base na data escolhida ou na data atual

    db.query(
      "INSERT INTO planos (valor, recorrencia, servicos, vezes_recorrencia, id_tutor,  data_fim, data_insercao) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        valor,
        recorrencia,
        servicos,
        vezes_recorrencia,
        id_tutor,
        data_fim,
        data_insercao,
      ], // Adicionando o parâmetro "data_insercao" na query SQL
      (err, result) => {
        if (err) {
          return res.status(500).send(err);
        }

        const plano_id = result.insertId;
        const tutor_plano_values = list.map(() => [id_tutor, plano_id]);
        db.query(
          "INSERT INTO tutor_planos (id_tutor, id_plano, valor_total) VALUES (?, ?, ?)",
          [id_tutor, result.insertId, totalValor],
          (err) => {
            if (err) {
              return res.status(500).send(err);
            } else {
              totalValor += valor;
              if (totalValor === valor * list.length) {
                db.query(
                  "UPDATE tutor SET status = false, data_ultima_fatura = ? WHERE id = ?",
                  [currentDate, id_tutor],
                  (err) => {
                    if (err) {
                      return res.status(500).send(err);
                    }
                    res.send("Planos criados com sucesso!");
                  }
                );
              }
            }
          }
        );
      }
    );
  });
});

app.get("/tutorpetplans/:id_tutor", (req, res) => {
  const id_tutor = req.params.id_tutor;
  db.query(
    "SELECT DISTINCT tutor.*, pets.*, planos.* FROM tutor LEFT JOIN pets ON tutor.id = pets.id_tutor LEFT JOIN planos ON tutor.id = planos.id_tutor WHERE tutor.id = ? AND MONTH(tutor.data_ultima_fatura) = MONTH(NOW()) ",
    [id_tutor],
    (err, result) => {
      if (err) {
        res.send(err);
      }
      res.json(result);
    }
  );
});

app.post("/data", (req, res) => {
  const currentDate = new Date().toISOString().slice(0, 10);
  const lastDayOfMonth = lastDayOfMonth(new Date()).toISOString().slice(0, 10);

  db.query(
    "INSERT INTO teste (data_inicio, data_fim) VALUES (?, ?)",
    [currentDate, lastDayOfMonth],
    (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }

      console.log(`Nova data inserida com sucesso! ID: ${result.insertId}`);
      res.send(`Nova data inserida com sucesso! ID: ${result.insertId}`);
    }
  );
});

app.post("/atualizar-status-tutor", (req, res) => {
  const { id_tutor, status } = req.body;

  db.query(
    "UPDATE tutor SET status = ? WHERE id = ?",
    [status, id_tutor],
    (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }

      res.send("Tutor status updated successfully");
    }
  );
});

app.post("/bulk-atualizar-status-tutor", (req, res) => {
  const { ids } = req.body;

  db.query("UPDATE tutor SET status = 1 WHERE id IN (?)", [ids], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    res.send("Tutor status updated successfully");
  });
});

/* app.post("/pets", (req, res) => {
    const { nome, apelido, raca, cor, nascimento, id_tutor } = req.body;

    db.query("SELECT * FROM tutor WHERE id = ?", [id_tutor], (err, result) => {
        if (err) {
            res.send(err);
        }
        if (result.length > 0) {
            db.query(
                "INSERT INTO pets (nome, apelido, raca, cor, nascimento, id_tutor) VALUES (?,?,?,?,?,?)",
                [nome, apelido, raca, cor, nascimento, id_tutor],
                (error, response) => {
                    if (error) {
                        res.send(error);
                    }

                    res.send({ msg: "Pet cadastrado com sucesso" });
                }
            );
        } else {
            res.send({ msg: "Tutor não encontrado" });
        }
    });
}); */

app.get("/pets", (req, res) => {
  db.query("SELECT * FROM pets", (err, result) => {
    if (err) {
      res.send(err);
    }
    res.send(result);
  });
});

app.get("/grades", (req, res) => {
  db.query("SELECT * FROM grades", (err, result) => {
    if (err) {
      res.send(err);
    }
    res.send(result);
  });
});

/* app.post("/grade-plano", (req, res) => {
  const { plano_id, plano_avulso_id, grade_id, id_tutor } = req.body;

  db.query(
    "INSERT INTO grade_plano (plano_id,plano_avulso_id, grade_id, id_tutor) VALUES (?, ?, ?, ?)",
    [plano_id, plano_avulso_id, grade_id, id_tutor],
    (err) => {
      if (err) {
        res.send(err);
      }
      res.send({ msg: "criado com sucesso" });
    }
  );
}); */

app.post("/grade-plano", (req, res) => {
  const { plano_id, plano_avulso_id, grade_id, id_tutor } = req.body;

  db.query(
    "INSERT INTO grade_plano (plano_id, plano_avulso_id, grade_id, id_tutor) VALUES (?, ?, ?, ?)",
    [plano_id, plano_avulso_id, grade_id, id_tutor],
    (err, result) => {
      if (err) {
        console.error(err);
        res
          .status(500)
          .send("Ocorreu um erro ao inserir na tabela grade_plano");
      } else {
        // Atualiza a coluna grade_servicos na tabela planos_avulso com o valor do grade_id
        db.query(
          "UPDATE planos_avulso SET grade_servicos = ? WHERE id = ?",
          [grade_id, plano_avulso_id],
          (err, result) => {
            if (err) {
              console.error(err);
              res
                .status(500)
                .send(
                  `Ocorreu um erro ao atualizar a tabela planos_avulso: ${err}`
                );
            } else if (result.affectedRows === 0) {
              res
                .status(400)
                .send("Nenhum registro foi atualizado na tabela planos_avulso");
            } else {
              res.send({ msg: "Criado com sucesso" });
            }
          }
        );
      }
    }
  );
});

app.get("/tutor/:id", (req, res) => {
  const id = req.params.id;
  db.query(
    "SELECT * FROM tutor INNER JOIN pets ON tutor.id = pets.id_tutor WHERE tutor.id = ?",
    [id],
    (err, result) => {
      if (err) {
        res.send(err);
      }
      res.json(result);
    }
  );
});

app.get("/contacts", (req, res) => {
  db.query(
    "SELECT tutor.id, tutor.nome, tutor.contact, tutor.email, tutor.cidade, tutor.endereco AS id_tutor, tutor.nome, tutor.contact, tutor.email, tutor.cidade, tutor.endereco AS  endereco,  GROUP_CONCAT(pets.nomePets SEPARATOR ', ') AS pets FROM tutor INNER JOIN pets ON tutor.id = pets.id_tutor GROUP BY tutor.id, tutor.nome, tutor.contact, tutor.email, tutor.endereco, tutor.cidade",
    (err, result) => {
      if (err) {
        res.send(err);
      }
      res.json(result);
    }
  );
});

app.get("/tutors", (req, res) => {
  db.query(
    "SELECT tutor.id AS id_tutor, tutor.nome AS nome, GROUP_CONCAT(pets.nomePets SEPARATOR ', ') AS pets FROM tutor INNER JOIN pets ON tutor.id = pets.id_tutor GROUP BY tutor.id, tutor.nome",
    (err, result) => {
      if (err) {
        res.send(err);
      }
      res.json(result);
    }
  );
});

app.get("/tutors/:id", (req, res) => {
  const tutorId = req.params.id;
  db.query(
    "SELECT id ,nome FROM tutor WHERE id = ?",
    [tutorId],
    (err, result) => {
      if (err) {
        res.send(err);
      }
      res.json(result);
    }
  );
});

app.get("/planos-tutor", (req, res) => {
  db.query(
    "SELECT * FROM planos INNER JOIN tutor ON planos.id_tutor = tutor.id",
    (err, result) => {
      if (err) {
        res.send(err);
      }
      res.json(result);
    }
  );
});

app.post("/planos_avulso", (req, res) => {
  const { valor, servicos } = req.body;

  const query = `INSERT INTO planos_avulso (valor,  servicos) VALUES (?, ?)`;
  db.query(query, [valor, servicos], (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.status(201).send(`Plano adicionado com o ID: ${results.insertId}`);
    }
  });
});

app.get("/planos_avulso", (req, res) => {
  const query = "SELECT * FROM planos_avulso";
  db.query(query, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.status(200).send(results);
    }
  });
});

app.get("/planos-avulso/servicos", (req, res) => {
  db.query("SELECT servicos, id FROM planos_avulso", (err, result) => {
    if (err) {
      return res.status(500).send(err);
    }
    res.send(result);
  });
});

app.get("/planos-avulsos/:nome_grade", (req, res) => {
  const { nome_grade } = req.params;

  db.query(
    "SELECT * FROM planos_avulso WHERE grade_servicos = (SELECT id FROM grades WHERE nome = ? LIMIT 1)",
    [nome_grade],
    (err, result) => {
      if (err) {
        return res.status(500).send(err);
      }

      res.send(result);
    }
  );
});

/* app.get("/planos-teste", (req, res) => {
  const query = "SELECT * FROM planos";
  db.query(query, (err, results) => {
    if (err) {
      console.log(err);
      res.status(500).send(err);
    } else {
      res.status(200).send(results);
    }
  });
}); */

/* app.get("/planos", (req, res) => {
  const id = req.params.id;
  db.query(
    "SELECT * FROM planos INNER JOIN tutor ON planos.id_tutor = tutor.id",
    (err, result) => {
      if (err) {
        res.send(err);
      }
      res.json(result);
    }
  );
}); */

app.get("/planos", (req, res) => {
  db.query(
    "SELECT tp.id_tutor, t.nome, t.email, t.status, GROUP_CONCAT(p.servicos) AS servicos, SUM(p.valor) AS valor_total, MAX(p.recorrencia) AS recorrencia, MAX(p.vezes_recorrencia) AS vezes_recorrencia FROM tutor_planos tp INNER JOIN planos p ON tp.id_plano = p.id INNER JOIN tutor t ON tp.id_tutor = t.id GROUP BY tp.id_tutor, t.nome, t.email, t.status",
    (err, result) => {
      if (err) {
        res.send(err);
      }
      res.json(result);
    }
  );
});

app.get("/tutores/:servico", (req, res) => {
  const servico = req.params.servico;
  db.query(
    "SELECT DISTINCT T.* FROM tutor T INNER JOIN planos S ON S.id_tutor = T.id WHERE S.servicos = ?",
    [servico],
    (err, results) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(results);
      }
    }
  );
});

/* app.get("/pets/:id_tutor", (req, res) => {
    const { id_tutor } = req.params;
    db.query("SELECT * FROM pets WHERE id_tutor = ?", [id_tutor], (err, result) => {
        if (err) {
            res.send(err);
        }
        res.send(result);
    });
}); */

app.post("/hotel", (req, res) => {
  const { id_tutor, valor, data_entrada, data_saida } = req.body;

  db.query(
    "INSERT INTO hotel (id_tutor, valor, data_entrada, data_saida) VALUES (?, ?, ?, ?)",
    [id_tutor, valor, data_entrada, data_saida],
    (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).send("Ocorreu um erro ao inserir na tabela hotel");
      } else {
        res.send({ msg: "Criado com sucesso" });
      }
    }
  );
});

app.listen(3001, () => {
  console.log("rodando na porta 3001");
});
