// LOGIN
export const login = (user) => {
    sessionStorage.setItem('auth_admin', JSON.stringify(user))
}

// UPDATE PROFILE
export const update_profile = (user) => {
    // sessionStorage.setItem('auth_admin', JSON.stringify(user))
    var myObj = JSON.parse(sessionStorage.getItem('auth_admin'));
    myObj = {...myObj, user:user};
    sessionStorage.setItem('auth_admin', JSON.stringify(myObj));
}

// LOGOUT
export const logout = () => sessionStorage.removeItem('auth_admin')

// LOGIN STATUS
export const isLogin = () => {
    var myObj = JSON.parse(sessionStorage.getItem('auth_admin'));
    var size = myObj ? Object.keys(myObj).length  : 0;
    if (size > 0) return true;
    return false;
}

// GET LOGIN DATA
export const getLoginData = () => {
    return JSON.parse(sessionStorage.getItem('auth_admin'));
}