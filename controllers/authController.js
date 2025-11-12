const UserRepository = require('../repositories/UserRepository');

const profileDateFormatter = new Intl.DateTimeFormat('pl-PL', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const buildProfilePayload = (user) => {
  if (!user) {
    return null;
  }

  const createdAt = user.createdAt ? new Date(user.createdAt) : null;

  return {
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: user.role === 'admin' ? 'Administrator' : 'Klient',
    createdAtISO: createdAt ? createdAt.toISOString() : null,
    createdAtDisplay: createdAt ? profileDateFormatter.format(createdAt) : 'Brak danych',
  };
};

const redirectToLogin = (req, res) => {
  if (req.session) {
    return req.session.destroy(() => res.redirect('/login'));
  }
  return res.redirect('/login');
};

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  const errors = {};
  const values = { name, email };

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name || name.trim() === '') {
      errors.name = 'Imie jest wymagane.';
    }
    if (!email || email.trim() === '') {
      errors.email = 'Email jest wymagany.';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Podaj poprawny adres email.';
    }
    if (!password || password.trim() === '') {
      errors.password = 'Haslo jest wymagane.';
    }

    const existingUser = email ? await UserRepository.findByEmail(email) : null;
    if (existingUser) {
      errors.email = 'Uzytkownik z tym adresem email juz istnieje.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).render('register', { errors, values });
    }

    const newUser = await UserRepository.createUser({ name, email, password });
    req.session.userId = newUser._id;
    req.session.userName = newUser.name;
    req.session.userRole = newUser.role;

    res.redirect('/');
  } catch (error) {
    console.error('Blad podczas rejestracji:', error);
    res
      .status(500)
      .render('register', { errors: { general: 'Wystapil blad. Sprobuj ponownie.' }, values });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const errors = {};
  const values = { email };

  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || email.trim() === '') {
      errors.email = 'Email jest wymagany.';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Podaj poprawny adres email.';
    }
    if (!password || password.trim() === '') {
      errors.password = 'Haslo jest wymagane.';
    }

    const user = email ? await UserRepository.findByEmail(email) : null;

    if (!user || !(await UserRepository.comparePassword(password, user.password))) {
      errors.general = 'Nieprawidlowy email lub haslo.';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).render('login', { errors, values });
    }

    req.session.userId = user._id;
    req.session.userName = user.name;
    req.session.userRole = user.role;
    res.redirect('/');
  } catch (error) {
    console.error('Blad podczas logowania:', error);
    res
      .status(500)
      .render('login', { errors: { general: 'Wystapil blad. Sprobuj ponownie.' }, values });
  }
};

exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Blad podczas wylogowywania.' });
    }
    res.redirect('/');
  });
};

exports.profile = async (req, res) => {
  try {
    const user = await UserRepository.findById(req.session.userId);

    if (!user) {
      return redirectToLogin(req, res);
    }

    const successMessage = req.session.profileSuccess || null;
    if (req.session.profileSuccess) {
      delete req.session.profileSuccess;
    }

    return res.render('profile', {
      profile: buildProfilePayload(user),
      errors: {},
      successMessage,
    });
  } catch (error) {
    console.error('Blad podczas wczytywania profilu:', error);
    return res
      .status(500)
      .render('profile', {
        profile: null,
        errors: { general: 'Nie udalo sie zaladowac profilu. Sprobuj ponownie.' },
        successMessage: null,
      });
  }
};

exports.updatePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = {};
  let user = null;

  try {
    user = await UserRepository.findById(req.session.userId);

    if (!user) {
      return redirectToLogin(req, res);
    }

    if (!currentPassword || currentPassword.trim() === '') {
      errors.currentPassword = 'Podaj obecne haslo.';
    }

    if (!newPassword || newPassword.trim() === '') {
      errors.newPassword = 'Podaj nowe haslo.';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Nowe haslo musi miec co najmniej 8 znakow.';
    }

    if (!confirmPassword || confirmPassword.trim() === '') {
      errors.confirmPassword = 'Potwierdz nowe haslo.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Hasla nie sa takie same.';
    }

    if (!errors.currentPassword) {
      const isCurrentPasswordValid = await UserRepository.comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        errors.currentPassword = 'Obecne haslo jest niepoprawne.';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res
        .status(400)
        .render('profile', {
          profile: buildProfilePayload(user),
          errors,
          successMessage: null,
        });
    }

    await UserRepository.updatePassword(req.session.userId, newPassword);

    req.session.profileSuccess = 'Haslo zostalo zaktualizowane.';
    return res.redirect('/profil');
  } catch (error) {
    console.error('Blad podczas aktualizacji hasla:', error);
    return res
      .status(500)
      .render('profile', {
        profile: buildProfilePayload(user),
        errors: { general: 'Nie udalo sie zaktualizowac hasla. Sprobuj ponownie.' },
        successMessage: null,
      });
  }
};
