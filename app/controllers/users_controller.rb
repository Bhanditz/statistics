class UsersController < ApplicationController
  
  before_filter :authenticate_user!, only: :logout
  
  def login    
    if params[:login]
      email = params[:user][:email]
      password = params[:user][:password]    
      user = User.authenticate(email ,password)
      if user
        session[:user_id] = user.id
        session[:user_email] = user.email
        redirect_to root_path, notice: "Login Successfully"
      else 
        redirect_to :back, notice: "Invalid login." 
      end      
    end
  end

  def demo
  end  

  def logout
    session.delete(:user_id)
    session.delete(:user_email)
    redirect_to root_url, notice: "Logout Successfully"
  end

end
