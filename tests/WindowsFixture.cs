using System;
using System.IO;
using System.Windows.Forms;
class WindowsFixture {
 [STAThread]static void Main(string[] args){var form=new Form{Text="AGVI automated test fixture",Width=450,Height=240,StartPosition=FormStartPosition.CenterScreen};var text=new RichTextBox{Left=20,Top=20,Width=380,Height=35};var button=new Button{Text="Fixture button",Left=20,Top=70,Width=200};form.Controls.Add(text);form.Controls.Add(button);text.TextChanged+=(s,e)=>File.WriteAllText(args[0],text.Text);button.Click+=(s,e)=>File.WriteAllText(args[0]+".clicked","ok");Application.Run(form);}
}
